import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

export function DiscussionList({ discussions }) {
  if (!discussions?.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No discussions found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <div
          key={discussion._id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <Link to={`/discussions/${discussion._id}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {discussion.title}
            </h3>
          </Link>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {discussion.replies?.length || 0} replies
            </span>
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {discussion.likes?.length || 0} likes
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={discussion.author?.profileImageUrl || defaultAvatar}
                alt={discussion.author?.username || 'User'}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-600">by</span>
              <Link
                to={`/users/${discussion.author?.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {discussion.author?.username || 'Unknown User'}
              </Link>
              {discussion.tags?.length > 0 && (
                <div className="flex gap-2 ml-4">
                  {discussion.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}