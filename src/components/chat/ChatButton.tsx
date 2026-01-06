import { useState } from 'react';
import { MessageCircle, X, Send, Settings, Cpu, Cloud, Maximize2, Minimize2 } from 'lucide-react';
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
    switchToOllama, 
    switchToGemini,
    changeModel,
    availableModels,
    loadingModels,
    currentModel
  } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

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
          "fixed bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-40 transition-all duration-300",
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
                <span className="capitalize">{connectionStatus.provider}</span>
                {connectionStatus.provider === 'ollama' && <Cpu className="h-3 w-3" />}
                {connectionStatus.provider === 'gemini' && <Cloud className="h-3 w-3" />}
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
              <h4 className="text-sm font-medium text-gray-900 mb-3">LLM Provider</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    switchToOllama();
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left",
                    connectionStatus.provider === 'ollama'
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Cpu className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Local Ollama</div>
                    <div className="text-xs text-gray-500">Private, runs locally</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    switchToGemini();
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors text-left",
                    connectionStatus.provider === 'gemini'
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <Cloud className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Google Gemini</div>
                    <div className="text-xs text-gray-500">Cloud-based, requires API key</div>
                  </div>
                </button>
              </div>

              {connectionStatus.provider === 'ollama' && availableModels.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Select Model
                  </label>
                  <div className="relative">
                    <select
                      value={currentModel || ''}
                      onChange={(e) => {
                        changeModel(e.target.value);
                      }}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm py-2 px-3 bg-white border"
                      disabled={loadingModels || loading}
                    >
                      {loadingModels ? (
                        <option>Loading models...</option>
                      ) : (
                        availableModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {currentModel && (
                    <div className="mt-2 text-xs text-gray-500">
                      Current: <span className="font-medium">{currentModel}</span>
                    </div>
                  )}
                </div>
              )}

              {connectionStatus.provider === 'ollama' && availableModels.length === 0 && !loadingModels && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-xs text-blue-800">
                    No models available. Make sure Ollama is running and has models installed.
                  </div>
                </div>
              )}

              {!connectionStatus.connected && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-xs text-yellow-800">
                    <strong>Connection Issue:</strong> {connectionStatus.message}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={cn(
            "overflow-y-auto p-4 space-y-4",
            isFullSize ? "flex-1" : "h-96"
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
                  <span className="text-sm text-gray-600">Fortivo AI is thinking...</span>
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