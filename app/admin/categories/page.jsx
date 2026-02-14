"use client";

import {
  PenIcon,
  PlusCircleIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  FilterIcon,
} from "lucide-react";
import { Fragment, useState, useEffect, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// URL API dengan fallback
const API_URL = process.env.NEXT_PUBLIC_GOLANG_URL || "http://localhost:8080";
const CATEGORIES_API = `${API_URL}/api/admin/categories`;

export default function CategoryPage() {
  // State untuk data
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // State untuk form - ubah is_active ke boolean
  const [formData, setFormData] = useState({
    name: "",
    is_active: true, // boolean langsung
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Fungsi untuk debugging
  useEffect(() => {
    console.log("API URL:", API_URL);
    console.log("Categories API:", CATEGORIES_API);
  }, []);

  // Fungsi fetch data
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Fetching categories from:", CATEGORIES_API);
      const response = await axios.get(CATEGORIES_API);

      console.log("API Response:", response.data);

      // Pastikan data ada dan valid
      if (response.data && response.data.data) {
        const categoriesData = response.data.data.map((category) => ({
          ...category,
          is_active: Boolean(category.is_active), // Pastikan boolean
        }));
        setCategories(categoriesData);
      } else {
        console.error("Unexpected API response format");
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data pada mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Filter data
  useEffect(() => {
    if (!categories.length) {
      setFilteredCategories([]);
      return;
    }

    let filtered = [...categories];

    // Filter by search
    if (search) {
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"; // Ubah dari "true" ke "active"
      filtered = filtered.filter(
        (category) => Boolean(category.is_active) === isActive,
      );
    }

    setFilteredCategories(filtered);
  }, [categories, search, statusFilter]);

  // Handle search
  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  // Handle filter change - ubah value options
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Open modal untuk tambah
  const openAddModal = () => {
    setModalType("add");
    setFormData({
      name: "",
      is_active: true, // boolean langsung
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open modal untuk edit
  const openEditModal = (category) => {
    setModalType("edit");
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      is_active: Boolean(category.is_active), // Pastikan boolean
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "is_active") {
      // Untuk select, konversi string ke boolean
      const boolValue = value === "true";
      setFormData((prev) => ({
        ...prev,
        [name]: boolValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Category name is required";
    } else if (formData.name.length < 2) {
      errors.name = "Category name must be at least 2 characters";
    }

    // is_active sudah boolean, tidak perlu validasi khusus
    if (typeof formData.is_active !== "boolean") {
      errors.is_active = "Status must be a boolean value";
    }

    return errors;
  };

  // Handle form submit
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        is_active: formData.is_active, // Sudah boolean
      };

      console.log("Submitting payload:", payload);

      if (modalType === "add") {
        // Add new category
        const response = await axios.post(CATEGORIES_API, payload);

        if (response.data && response.data.data) {
          const newCategory = {
            ...response.data.data,
            is_active: Boolean(response.data.data.is_active),
          };
          setCategories((prev) => [...prev, newCategory]);
          toast.success(`Category "${formData.name}" added successfully`);
        }
      } else {
        // Update existing category
        const response = await axios.put(
          `${CATEGORIES_API}/${selectedCategory.id}`,
          payload,
        );

        if (response.data && response.data.data) {
          const updatedCategory = {
            ...response.data.data,
            is_active: Boolean(response.data.data.is_active),
          };
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === selectedCategory.id ? updatedCategory : cat,
            ),
          );
          toast.success(`Category "${formData.name}" updated successfully`);
        }
      }

      setIsModalOpen(false);
      setFormData({ name: "", is_active: true });
      setFormErrors({});
    } catch (error) {
      console.error("Error saving category:", error);
      console.error("Error details:", error.response?.data);

      // Tampilkan error yang lebih spesifik
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to save category";

      toast.error(`Error: ${errorMessage}`);

      // Untuk testing, gunakan dummy data jika API error
      if (modalType === "add") {
        const newCategory = {
          id: Date.now(),
          ...payload,
          created_at: new Date().toISOString(),
        };
        setCategories((prev) => [...prev, newCategory]);
        toast.info(`Added locally: "${formData.name}"`);
      } else {
        const updatedCategory = {
          ...selectedCategory,
          ...payload,
        };
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === selectedCategory.id ? updatedCategory : cat,
          ),
        );
        toast.info(`Updated locally: "${formData.name}"`);
      }

      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (category) => {
    if (
      !window.confirm(`Are you sure you want to delete "${category.name}"?`)
    ) {
      return;
    }

    try {
      await axios.delete(`${CATEGORIES_API}/${category.id}`);

      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
      toast.success(`Category "${category.name}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting category:", error);

      // Jika API error, hapus dari state lokal
      setCategories((prev) => prev.filter((cat) => cat.id !== category.id));
      toast.info(`Deleted locally: "${category.name}"`);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  // Komponen Loading
  const LoadingSpinner = () => (
    <div className="py-20 text-center">
      <div className="inline-flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading categories...</span>
      </div>
    </div>
  );

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Category Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your product categories and their status
                </p>
              </div>
              <button
                onClick={openAddModal}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Add New Category
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Categories</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {categories.length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">C</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Active Categories</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {categories.filter((cat) => cat.is_active).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50">
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Inactive Categories</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {categories.filter((cat) => !cat.is_active).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <AlertCircleIcon className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Section */}
          <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={handleSearch}
                    placeholder="Search category by name..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 text-black">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FilterIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={handleFilterChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>
                </div>

                {(search || statusFilter !== "all") && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold">{filteredCategories.length}</span>{" "}
              of <span className="font-semibold">{categories.length}</span>{" "}
              categories
              {(search || statusFilter !== "all") && (
                <span className="ml-2">
                  (filtered by {search && `"${search}"`}{" "}
                  {search && statusFilter !== "all" && "and "}{" "}
                  {statusFilter !== "all" && `${statusFilter} status`})
                </span>
              )}
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <LoadingSpinner />
            ) : filteredCategories.length === 0 ? (
              <div className="py-20 text-center">
                <div className="max-w-md mx-auto">
                  <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No categories found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {search || statusFilter !== "all"
                      ? "Try adjusting your search or filter to find what you're looking for."
                      : "Get started by adding your first category."}
                  </p>
                  {!search && statusFilter === "all" && (
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                    >
                      <PlusCircleIcon className="w-5 h-5 mr-2" />
                      Add First Category
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Category Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCategories.map((category, index) => (
                      <tr
                        key={category.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 uppercase">
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              category.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {category.is_active ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                ACTIVE
                              </>
                            ) : (
                              <>
                                <AlertCircleIcon className="w-3 h-3 mr-1" />
                                INACTIVE
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(category)}
                              className="inline-flex items-center px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <PenIcon className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(category)}
                              className="inline-flex items-center px-3 py-1.5 text-sm border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2Icon className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredCategories.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredCategories.length}</span>{" "}
                of{" "}
                <span className="font-medium">{filteredCategories.length}</span>{" "}
                results
              </div>
              <div className="flex space-x-2">
                <button
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  Previous
                </button>
                <button className="px-3 py-2 border border-blue-600 bg-blue-600 text-white rounded-md">
                  1
                </button>
                <button
                  disabled
                  className="px-3 py-2 border border-gray-300 rounded-md text-gray-400 bg-gray-50 cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Component */}
      <Transition show={isModalOpen} as={Fragment}>
        <Dialog
          onClose={() => setIsModalOpen(false)}
          className="relative text-black z-50"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        {modalType === "add"
                          ? "Add New Category"
                          : "Edit Category"}
                      </Dialog.Title>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XIcon className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {modalType === "add"
                        ? "Create a new category for your products"
                        : "Update the category information"}
                    </p>
                  </div>

                  {/* Form */}
                  <div className="px-6 py-5">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter category name"
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-sm text-red-600">
                            {formErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status *
                        </label>
                        <select
                          name="is_active"
                          value={formData.is_active ? "true" : "false"} // Konversi boolean ke string untuk select
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            formErrors.is_active
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        {formErrors.is_active && (
                          <p className="mt-1 text-sm text-red-600">
                            {formErrors.is_active}
                          </p>
                        )}
                        <p className="mt-2 text-sm text-gray-500">
                          Active categories will be visible to users
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? (
                          <>
                            <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                            {modalType === "add" ? "Saving..." : "Updating..."}
                          </>
                        ) : modalType === "add" ? (
                          "Save Category"
                        ) : (
                          "Update Category"
                        )}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
