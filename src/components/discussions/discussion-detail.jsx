import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { MessageSquare, ThumbsUp, Clock, Edit, Trash2, Send } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import {
  Alert,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const REPLIES_PER_PAGE = 20;
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

// Helper function to safely format dates
const formatDate = (dateString) => {
  try {
    if (!dateString) return 'Unknown date';
    const date = parseISO(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Helper function to get user avatar
const getUserAvatar = (user) => {
  if (!user) return DEFAULT_AVATAR;
  // First try to get the image URL from Clerk's user object
  if (user.imageUrl) return user.imageUrl;
  // Fallback to profileImageUrl if present
  if (user.profileImageUrl) return user.profileImageUrl;
  // Final fallback to default avatar
  return DEFAULT_AVATAR;
};

export function DiscussionDetail() {
  const { discussionId } = useParams();
  const { getToken, userId, isSignedIn } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReply, setNewReply] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bottomRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  const fetchDiscussion = async () => {
    try {
      // Public endpoint - no auth required
      const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}`);

      if (!response.ok) throw new Error('Failed to fetch discussion');
      const data = await response.json();
      setDiscussion(data);
      setEditedContent(data.content);
    } catch (err) {
      setError('Failed to load discussion');
    }
  };

  const fetchReplies = async (pageNum = 1, append = false) => {
    try {
      // Public endpoint - no auth required
      const response = await fetch(
        `http://localhost:3000/api/discussions/${discussionId}/replies?page=${pageNum}&limit=${REPLIES_PER_PAGE}`
      );

      if (!response.ok) throw new Error('Failed to fetch replies');
      const data = await response.json();

      setHasMore(data.replies.length === REPLIES_PER_PAGE);
      setReplies(prev => append ? [...prev, ...data.replies] : data.replies);
    } catch (err) {
      setError('Failed to load replies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussion();
    fetchReplies();
  }, [discussionId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReplies(nextPage, true);
  };

  const handleLike = async () => {
    if (!isSignedIn) {
      setError('Please sign in to like discussions');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error('Failed to like discussion');
      const updatedDiscussion = await response.json();
      setDiscussion(updatedDiscussion);
    } catch (err) {
      setError('Failed to like discussion');
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      setError('Please sign in to reply');
      return;
    }

    if (!newReply.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newReply }),
      });

      if (!response.ok) throw new Error('Failed to post reply');

      const reply = await response.json();
      setReplies(prev => [...prev, reply]);
      setNewReply('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDiscussion = async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (!response.ok) throw new Error('Failed to update discussion');

      const updatedDiscussion = await response.json();
      setDiscussion(updatedDiscussion);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update discussion');
    }
  };

  const handleDeleteDiscussion = async () => {
    if (!isSignedIn) return;

    if (!window.confirm('Are you sure you want to delete this discussion?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/discussions/${discussionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) throw new Error('Failed to delete discussion');

      // Navigate back to discussions list
      window.location.href = '/discussions';
    } catch (err) {
      setError('Failed to delete discussion');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  if (error) return <Alert severity="error"><AlertTitle>{error}</AlertTitle></Alert>;
  if (!discussion) return <Alert severity="error"><AlertTitle>Discussion not found</AlertTitle></Alert>;

  const isAuthor = isSignedIn && userId === discussion.author.id;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Discussion Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start gap-3">
            <img
              src={getUserAvatar(discussion.author)}
              alt={discussion.author.username}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{discussion.title}</h1>
              <div className="text-sm text-gray-500 mt-1">
                by {discussion.author.username} • {formatDate(discussion.createdAt)}
              </div>
            </div>
          </div>
          {isAuthor && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteDiscussion}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px]"
            />
            <div className="flex gap-2">
              <Button onClick={handleUpdateDiscussion}>Save Changes</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="prose max-w-none mb-4 whitespace-pre-wrap">{discussion.content}</div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mt-4 pt-4 border-t">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              className={isSignedIn && discussion.likes?.includes(userId) ? 'text-blue-600' : ''}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              {discussion.likes?.length || 0} likes
            </Button>
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              {replies.length} replies
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              {formatDate(discussion.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-4">
        {hasMore && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLoadMore}
          >
            Load More Replies
          </Button>
        )}

        {replies.map((reply) => (
            <div key={reply._id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start space-x-3">
                <img
                    src={reply.author.imageUrl}
                    alt={reply.author.username}
                    className="w-8 h-8 rounded-full"
                />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                    <span className="font-medium">{reply.author.username}</span>
                    <span className="text-sm text-gray-500">
                        {formatDate(reply.createdAt)}
                    </span>
                    </div>
                    <p className="mt-1 text-gray-800 whitespace-pre-wrap">{reply.content}</p>
                </div>
            </div>
        </div>
        ))}

        <div ref={bottomRef} />

        {/* Reply Form */}
        {isSignedIn ? (
          <form onSubmit={handleSubmitReply} className="sticky bottom-0 bg-white p-4 rounded-lg shadow-lg">
            <div className="flex gap-2 items-start">
              <img
                src={getUserAvatar({ imageUrl: discussion.author?.imageUrl })}
                alt="Your avatar"
                className="w-8 h-8 rounded-full mt-1"
              />
              <div className="flex-1">
                <Textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1"
                  rows={1}
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !newReply.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Send
              </Button>
            </div>
          </form>
        ) : (
          <div className="sticky bottom-0 bg-white p-4 rounded-lg shadow-lg text-center">
            <p className="text-gray-600 mb-2">Sign in to join the discussion</p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DiscussionDetail;
