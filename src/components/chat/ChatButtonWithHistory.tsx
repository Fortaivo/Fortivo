import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Settings, Cloud, Maximize2, Minimize2, Bot, RefreshCw, List } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.min.css';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useChatWithHistory } from '../../hooks/useChatWithHistory';
import { ConversationList } from './ConversationList';

export function ChatButtonWithHistory() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [message, setMessage] = useState('');
  const {
    messages,
    sendMessage,
    loading,
    conversations,
    currentConversationId,
    loadingConversations,
    loadConversation,
    createNewConversation,
    deleteConversationById,
    updateConversationTitle,
    connectionStatus,
    useAgent,
    toggleAgent,
    resetSession,
    currentModel
  } = useChatWithHistory();
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    await sendMessage(message);
    setMessage('');
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-50"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className={cn(
          "fixed bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-40 transition-all duration-300 flex",
          isFullSize
            ? "inset-4 w-auto h-auto"
            : "bottom-24 right-6 w-[900px] max-h-[600px]"
        )}>
          {/* Conversation Sidebar */}
          {showSidebar && (
            <ConversationList
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelectConversation={loadConversation}
              onCreateConversation={createNewConversation}
              onDeleteConversation={deleteConversationById}
              onUpdateTitle={updateConversationTitle}
              loading={loadingConversations}
            />
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="text-white hover:text-indigo-200 transition-colors"
                  title={showSidebar ? "Hide conversations" : "Show conversations"}
                >
                  <List className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-lg font-semibold">Fortivo AI Assistant</h3>
                  <div className="flex items-center space-x-2 text-xs text-indigo-100 mt-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      connectionStatus.connected ? "bg-green-300" : "bg-red-300"
                    )} />
                    <span className="capitalize">AWS Bedrock</span>
                    <Cloud className="h-3 w-3" />
                    {useAgent && <Bot className="h-3 w-3" />}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFullSize(!isFullSize)}
                  className="text-white hover:text-indigo-200 transition-colors"
                  title={isFullSize ? "Minimize" : "Maximize"}
                >
                  {isFullSize ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-white hover:text-indigo-200 transition-colors"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-indigo-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-b bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-3">AWS Bedrock Settings</h4>

                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-indigo-900">Claude Sonnet 4.5</div>
                        <div className="text-xs text-indigo-700 mt-1">{currentModel}</div>
                      </div>
                      <Cloud className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Bedrock Agents</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {useAgent ? 'Server-side tool execution enabled' : 'Client-side tool execution (faster)'}
                      </div>
                    </div>
                    <button
                      onClick={toggleAgent}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        useAgent ? "bg-indigo-600" : "bg-gray-200"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        useAgent ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Connection Status</div>
                      <div className="text-xs text-gray-500 mt-1">{connectionStatus.message}</div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded text-xs font-medium",
                      connectionStatus.connected
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    )}>
                      {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>

                  <button
                    onClick={resetSession}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reset Session</span>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex",
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            code: (props) => {
                              const { inline, className, children } = props;
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <code className={className}>
                                  {children}
                                </code>
                              ) : (
                                <code className="bg-gray-200 text-gray-800 px-1 rounded">
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-600">Claude is thinking...</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about your assets, beneficiaries, or legacy planning..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={loading}
                />
                <Button type="submit" disabled={loading || !message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
