"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import BusinessList from "@/components/business/BusinessList";
import BusinessCreateForm from "@/components/business/BusinessCreateForm";
import Input from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

export default function BusinessPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showMyBusinesses, setShowMyBusinesses] = useState(
    user?.accountType === "business"
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const categories = [
    "All",
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Retail",
    "Manufacturing",
    "Services",
    "Real Estate",
  ];

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    setShowMyBusinesses(true);
    // The BusinessList will reload because of the userId/category dependency if we handle it right,
    // but a simple window reload or state update would also work.
    // Since BusinessList uses userId as a dependency, and it's already set to showMyBusinesses,
    // it will reload the user's businesses.
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {showMyBusinesses ? "My Businesses" : "Discover Businesses"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {showMyBusinesses
              ? "Manage and view your business profiles"
              : "Connect with verified businesses and explore opportunities"}
          </p>
        </div>

        {user?.accountType === "business" && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/25 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Register Business
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <Input
            type="text"
            placeholder="Search businesses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Business Owner Toggle */}
        {user?.accountType === "business" && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowMyBusinesses(true)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 border ${showMyBusinesses
                ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-primary-500/50"
                }`}
            >
              My Businesses
            </button>
            <button
              onClick={() => setShowMyBusinesses(false)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 border ${!showMyBusinesses
                ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-primary-500/50"
                }`}
            >
              Discover
            </button>
          </div>
        )}

        {/* Category Tabs */}
        {!showMyBusinesses && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(category === "All" ? "" : category)
                }
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 border ${(category === "All" && !selectedCategory) ||
                  category === selectedCategory
                  ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25"
                  : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:border-primary-500/50"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Business List */}
      <BusinessList
        searchQuery={searchQuery}
        category={showMyBusinesses ? "" : selectedCategory}
        userId={showMyBusinesses ? user?._id : undefined}
      />

      {/* Create Form Modal */}
      {showCreateForm && (
        <BusinessCreateForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
