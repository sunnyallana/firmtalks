import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DiscussionList({ discussions }) {
  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <div
          key={discussion.id}
          className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
        >
          <Link to={`/discussions/${discussion.id}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {discussion.title}
            </h3>
          </Link>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4">
            <span className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {discussion.replies} replies
            </span>
            <span className="flex items-center">
              <ThumbsUp className="w-4 h-4 mr-1" />
              {discussion.likes} likes
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">by</span>
              <Link
                to={`/users/${discussion.author.username}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {discussion.author.username}
              </Link>
              <span className="text-sm text-gray-500">
                ({discussion.author.reputation} rep)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}