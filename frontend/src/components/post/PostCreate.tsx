"use client";

import { Image as ImageIcon, Send, X, Hash, Smile, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '../common/Avatar';
import categoryService, { Category } from '@/services/categoryService';

interface PostCreateProps {
  onSubmit: (content: string, media?: File[], category?: string) => void;
}

const PostCreate: React.FC<PostCreateProps> = ({ onSubmit }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; preview: string; type: 'image' | 'video' }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCats(true);
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoadingCats(false);
      }
    };
    fetchCategories();
  }, []);

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

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commonEmojis = ['😊', '😂', '❤️', '🔥', '👍', '🙌', '🚀', '✨', '💡', '💯', '🤔', '👀', '💼', '🤝', '📈', '✅'];

  const addEmoji = (emoji: string) => {
    setContent(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedMedia.length === 0) return;

    setIsSubmitting(true);
    try {
      // Always pass content, even if empty (when there's media)
      const postContent = content.trim() || ' '; // Send a space if content is empty but media exists
      await onSubmit(postContent, selectedMedia.map(m => m.file), selectedCategory || undefined);
      setContent('');
      setSelectedCategory('');
      setSelectedMedia(prev => {
        prev.forEach(m => URL.revokeObjectURL(m.preview));
        return [];
      });
      setIsExpanded(false);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`glass-card p-6 transition-all duration-500 ${isExpanded ? 'shadow-2xl' : 'shadow-lg'}`}
    >
      <div className="flex gap-4">
        <div className="hidden sm:block">
          <Avatar src={user?.avatar} alt={user?.username || 'User'} size="md" className="border-2 border-primary-500/20" />
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Share something professional..."
            className="w-full px-0 py-2 bg-transparent border-none focus:ring-0 text-lg dark:text-gray-100 dark:placeholder:text-gray-500 resize-none min-h-[40px] transition-all duration-300"
            rows={isExpanded ? 3 : 1}
          />

          <AnimatePresence>
            {selectedMedia.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-dashed border-gray-200 dark:border-white/10"
              >
                {selectedMedia.map((media, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden shadow-sm">
                    {media.type === 'video' ? (
                      <video src={media.preview} muted autoPlay loop className="w-full h-full object-cover" />
                    ) : (
                      <div className="relative w-full h-full">
                        <Image
                          src={media.preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/40 text-[8px] text-white font-black uppercase rounded backdrop-blur-md">
                      {media.type}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {(isExpanded || content || selectedMedia.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-white/5"
            >
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleMediaSelect}
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                />
                <ActionIconButton onClick={() => fileInputRef.current?.click()} icon={<ImageIcon className="w-5 h-5" />} label="Media" color="text-primary-500" />
                <div className="relative group">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={isLoadingCats}
                    className="appearance-none bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 pr-8 focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{isLoadingCats ? 'Loading...' : 'Category'}</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  <Tag className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
                <ActionIconButton icon={<Hash className="w-5 h-5" />} label="Tag" color="text-indigo-500" onClick={() => setContent(prev => prev + (prev.endsWith(' ') || prev === '' ? '#' : ' #'))} />

                <div className="relative">
                  <ActionIconButton
                    icon={<Smile className="w-5 h-5" />}
                    label="Emoji"
                    color="text-amber-500"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute bottom-full left-0 mb-2 p-2 glass-card z-50 grid grid-cols-4 gap-1 min-w-[160px]"
                    >
                      {commonEmojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addEmoji(emoji)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-xl transition-all hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={() => {
                    setIsExpanded(false);
                    setContent('');
                    setSelectedCategory('');
                    setShowEmojiPicker(false);
                    setSelectedMedia(prev => {
                      prev.forEach(m => URL.revokeObjectURL(m.preview));
                      return [];
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold transition-colors"
                >
                  Clear
                </button>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={(!content.trim() && selectedMedia.length === 0) || isSubmitting}
                  className="px-8 py-3 bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-indigo-700 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-primary-500/20 disabled:opacity-40 disabled:grayscale transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>POST IT</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ActionIconButton = ({ icon, label, onClick, color }: { icon: React.ReactNode; label: string; onClick?: () => void; color: string }) => (
  <button
    onClick={onClick}
    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all group relative flex items-center gap-2 ${color}`}
  >
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all absolute left-full whitespace-nowrap bg-white dark:bg-gray-950 px-2 py-1 rounded-md shadow-lg pointer-events-none z-50">
      {label}
    </span>
  </button>
);

export default PostCreate;
