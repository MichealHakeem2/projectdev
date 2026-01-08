"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import Input from "../common/Input";
import Avatar from "../common/Avatar";
import Spinner from "../common/Spinner";
import userService, { User } from "@/services/userService";

interface UserSearchModalProps {
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ onClose, onSelectUser }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await userService.searchUsers(query);
            setResults(data);
            setHasSearched(true);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else {
                setResults([]);
                setHasSearched(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, handleSearch]);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary-500" />
                        New Message
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                        <Input
                            autoFocus
                            type="text"
                            placeholder="Search by username or name..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto max-h-[400px] p-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => onSelectUser(user)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl transition-all group"
                                >
                                    <Avatar src={user.avatar} alt={user.username} size="md" />
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">
                                            {user.username}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {user.accountType === "business" ? "Business Account" : "Personal Account"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : hasSearched && query.length >= 2 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 dark:text-gray-400">No users found matching &quot;{query}&quot;</p>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400 dark:text-gray-500 text-sm">Type at least 2 characters to start searching</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default UserSearchModal;
