import { useState } from 'react';
import { MessageCircle, X, Send, Settings, Cloud, Maximize2, Minimize2, Bot, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.min.css';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useChat } from '../../hooks/useChat';

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [message, setMessage] = useState('');
  const { 
    messages, 
    sendMessage, 
    loading, 
    connectionStatus, 
    useAgent,
    toggleAgent,
    resetSession,
    currentModel
  } = useChat();
  const [showSettings, setShowSettings] = useState(false);

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
          "fixed bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-40 transition-all duration-300 flex flex-col",
          isFullSize 
            ? "inset-4 w-auto h-auto" 
            : "bottom-24 right-6 w-96 max-h-[600px]"
        )}>
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
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

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-gray-900">Bedrock Agents</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {useAgent ? 'Enabled - Advanced AI capabilities' : 'Disabled - Standard chat'}
                    </div>
                  </div>
                  <button
                    onClick={toggleAgent}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      useAgent ? "bg-indigo-600" : "bg-gray-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        useAgent ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                <button
                  onClick={resetSession}
                  className="w-full flex items-center justify-center space-x-2 p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reset Session</span>
                </button>
              </div>

              {!connectionStatus.connected && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs text-yellow-800">
                    <strong>Connection Issue:</strong> {connectionStatus.message}
                  </div>
                </div>
              )}

              {connectionStatus.connected && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-800">
                    <strong>Connected:</strong> {connectionStatus.message}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={cn(
            "overflow-y-auto p-4 space-y-4 flex-1",
            isFullSize ? "" : "h-96"
          )}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn("max-w-[80%] rounded-lg p-3",
                  msg.role === 'user'
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white ml-auto"
                    : "bg-gray-50 text-gray-900 border border-gray-200"
                )}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-900">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code: (props) => {
                          const { inline, children } = props;
                          return !inline ? (
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
                              <code>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className="bg-gray-200 px-1 py-0.5 rounded text-sm">
                              {children}
                            </code>
                          );
                        },
                        p: (props) => <p className="mb-2 last:mb-0">{props.children}</p>,
                        ul: (props) => <ul className="list-disc list-inside mb-2 space-y-1">{props.children}</ul>,
                        ol: (props) => <ol className="list-decimal list-inside mb-2 space-y-1">{props.children}</ol>,
                        li: (props) => <li className="text-gray-700">{props.children}</li>,
                        strong: (props) => <strong className="font-semibold text-gray-900">{props.children}</strong>,
                        h1: (props) => <h1 className="text-lg font-bold text-gray-900 mb-2">{props.children}</h1>,
                        h2: (props) => <h2 className="text-base font-semibold text-gray-900 mb-2">{props.children}</h2>,
                        h3: (props) => <h3 className="text-sm font-semibold text-gray-900 mb-1">{props.children}</h3>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="bg-gray-50 text-gray-900 max-w-[80%] rounded-lg p-3 border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-sm text-gray-600">Claude is thinking...</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about your assets, beneficiaries, or portfolio..."
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <Button type="submit" disabled={loading || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
