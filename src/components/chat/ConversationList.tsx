import React, { useState } from 'react';
import { ChatConversation } from '../../lib/api';
import { PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  loading?: boolean;
}

export function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  onUpdateTitle,
  loading = false,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conversation: ChatConversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title || 'Untitled');
  };

  const handleSaveEdit = async (id: string) => {
    if (editTitle.trim()) {
      await onUpdateTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onCreateConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No conversations yet.<br />
            Click "New Chat" to start!
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`
                  group relative px-3 py-2 mx-2 my-1 rounded-lg cursor-pointer transition-colors
                  ${
                    conversation.id === currentConversationId
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => onSelectConversation(conversation.id)}
              >
                {editingId === conversation.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleSaveEdit(conversation.id)}
                    onKeyDown={(e) => handleKeyDown(e, conversation.id)}
                    className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.title || 'Untitled Conversation'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(conversation.updatedAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action buttons (show on hover) */}
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(conversation);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Rename"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this conversation?')) {
                              onDeleteConversation(conversation.id);
                            }
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}
