import React, { useState } from "react";
import Image from "next/image";
import { X, Upload, Plus, Building2, Globe, Mail, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Button from "../common/Button";
import Input from "../common/Input";
import businessService, { CreateBusinessData, Business } from "@/services/businessService";

interface BusinessCreateFormProps {
    onClose: () => void;
    onSuccess: (newBusiness: Business) => void;
}

export default function BusinessCreateForm({ onClose, onSuccess }: BusinessCreateFormProps) {
    const [formData, setFormData] = useState<Partial<CreateBusinessData>>({
        name: "",
        description: "",
        category: "Services",
        website: "",
        email: "",
        phone: "",
    });

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (type === 'logo') {
                setLogoFile(file);
                setLogoPreview(URL.createObjectURL(file));
            } else {
                setCoverFile(file);
                setCoverPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.category) {
            setError("Please fill in required fields");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const dataToSubmit: CreateBusinessData = {
                name: formData.name!,
                description: formData.description || "",
                category: formData.category!,
                website: formData.website,
                email: formData.email,
                phone: formData.phone,
                logo: logoFile || undefined,
                coverImage: coverFile || undefined,
            };

            const created = await businessService.createBusiness(dataToSubmit);
            onSuccess(created);
            onClose();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create business profile";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        "Technology", "Finance", "Healthcare", "Education", "Retail",
        "Manufacturing", "Services", "Real Estate", "Entertainment", "Food & Beverage"
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-950 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-premium border border-white/10"
            >
                {/* Header */}
                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl z-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-primary-500 rounded-2xl">
                                <Building2 className="text-white w-6 h-6" />
                            </div>
                            Register Business
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Launch your professional presence</p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-black uppercase tracking-widest text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form id="create-business-form" onSubmit={handleSubmit} className="space-y-10">
                        {/* Visuals Step */}
                        {step === 1 ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-4 text-center pb-4">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Visual Identity</h3>
                                    <p className="text-gray-400 text-xs">Set your logo and cover image</p>
                                </div>

                                <div className="flex flex-col items-center gap-8">
                                    {/* Logo Upload */}
                                    <div className="relative group">
                                        <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-gray-900 border-4 border-dashed border-gray-200 dark:border-white/5 hover:border-primary-500 transition-all cursor-pointer relative shadow-inner">
                                            {logoPreview ? (
                                                <Image src={logoPreview} alt="Logo" fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 bg-gray-50 dark:bg-gray-900">
                                                    <Plus className="w-8 h-8" />
                                                    <span className="text-[10px] uppercase font-black tracking-widest">Logo</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-primary-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
                                                <Upload className="text-white w-8 h-8" />
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'logo')}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Cover Upload */}
                                    <div className="w-full relative group h-32 rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-white/5 hover:border-primary-500 transition-all cursor-pointer">
                                        {coverPreview ? (
                                            <Image src={coverPreview} alt="Cover" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400">
                                                <Upload className="w-6 h-6" />
                                                <span className="text-[10px] uppercase font-black tracking-widest">Add Cover Image</span>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(e, 'cover')}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Button
                                        variant="primary"
                                        onClick={() => formData.name && setStep(2)}
                                        disabled={!formData.name}
                                        className="rounded-full px-12 py-6 text-lg"
                                        icon={ChevronRight}
                                    >
                                        Next Step
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="space-y-4 text-center pb-4">
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary-500">Business Details</h3>
                                    <p className="text-gray-400 text-xs">Tell us about your company</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input
                                        label="Business Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Enter business name"
                                    />
                                    <div className="space-y-2">
                                        <label className="text-sm font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all text-sm font-bold text-gray-900 dark:text-gray-100 appearance-none shadow-inner"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-sm font-black uppercase tracking-widest text-gray-400 ml-1 mb-2 block">Tell your story</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={4}
                                            className="w-full px-6 py-5 bg-gray-50 dark:bg-white/5 border-none rounded-3xl focus:ring-2 focus:ring-primary-500 transition-all text-sm font-medium text-gray-900 dark:text-gray-100 shadow-inner"
                                            placeholder="What makes your business special?"
                                        />
                                    </div>

                                    <Input
                                        label="Website"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        icon={<Globe className="w-5 h-5" />}
                                    />
                                    <Input
                                        label="Business Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        icon={<Mail className="w-5 h-5" />}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 rounded-2xl">Back</Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        isLoading={loading}
                                        className="flex-[2] rounded-2xl py-6 shadow-premium"
                                    >
                                        Finish Registration
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Hidden initial name input for step 1 validation */}
                        {step === 1 && (
                            <div className="mt-8">
                                <Input
                                    label="Business Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Startup, Shop, or Company name"
                                />
                            </div>
                        )}
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
