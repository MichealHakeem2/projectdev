import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Send, X, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../common/Avatar';
import { useAuth } from '@/hooks/useAuth';

interface PostCreateProps {
  onSubmit: (content: string, media?: File[]) => void;
}

const PostCreate: React.FC<PostCreateProps> = ({ onSubmit }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newMedia = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }));

    setSelectedMedia(prev => [...prev, ...newMedia]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsExpanded(true);
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content, selectedMedia.map(m => m.file));
      setContent('');
      setSelectedMedia(prev => {
        prev.forEach(m => URL.revokeObjectURL(m.preview));
        return [];
      });
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-effect rounded-xl p-6">
      <div className="flex gap-4">
        <Avatar src={user?.avatar} alt={user?.username || 'User'} size="md" />
        
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="What's on your mind?"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 dark:focus:ring-primary-500/20 transition-all duration-200 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm resize-none dark:text-gray-100 dark:placeholder:text-gray-500"
            rows={isExpanded ? 4 : 1}
          />

          <AnimatePresence>
            {selectedMedia.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2"
              >
                {selectedMedia.map((media, index) => (
                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                    {media.type === 'video' ? (
                      <video src={media.preview} muted autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                      <img src={media.preview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {media.type === 'video' && (
                      <div className="absolute bottom-1 left-1 p-1 bg-black/50 text-white rounded text-[10px]">
                        Video
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {(isExpanded || content || selectedMedia.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 flex items-center justify-between"
            >
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 group relative"
                  title="Add Image"
                >
                  <ImageIcon className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400 group relative"
                  title="Add Video"
                >
                  <Film className="w-5 h-5 group-hover:text-primary-500 transition-colors" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setSelectedMedia(prev => {
                      prev.forEach(m => URL.revokeObjectURL(m.preview));
                      return [];
                    });
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={(!content.trim() && selectedMedia.length === 0) || isSubmitting}
                  className="px-6 py-2 gradient-bg-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostCreate;
