"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "../contexts/UserContext";
import ProtectedRoute from "../components/ProtectedRoute";
import { apiService } from "../services/apiService";
import { 
  MdSearch, 
  MdDownload, 
  MdAdd,
  MdEdit,
  MdDelete,
  MdMessage,
  MdPhone,
  MdEmail,
  MdPerson,
  MdBlock,
  MdCheckCircle,
  MdClose,
  MdUpload,
  MdCloudUpload,
  MdTag,
  MdNotes,
  MdClear,
  MdLabel
} from "react-icons/md";

type Contact = {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  tags?: string[];
  notes?: string;
  created_at: string;
  last_message_at?: string;
  status?: "active" | "blocked" | "unsubscribed";
  userId?: string;
  companyId?: string;
};

type NewContact = {
  phone: string;
  name: string;
  email?: string;
  tags: string[];
  notes?: string;
  userId?: string;
  companyId?: string;
};

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useUser();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showTagsModal, setShowTagsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [tagsEditingContact, setTagsEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [tagsFormData, setTagsFormData] = useState({
    selectedTags: [] as string[],
    newTag: ""
  });
  
  // Form state for adding/editing contacts
  const [formData, setFormData] = useState<NewContact>({
    phone: "",
    name: "",
    email: "",
    tags: [],
    notes: ""
  });
  const [newTag, setNewTag] = useState("");
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importing, setImporting] = useState(false);

  // Utility functions
  const showError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const resetForm = () => {
    setFormData({
      phone: "",
      name: "",
      email: "",
      tags: [],
      notes: ""
    });
    setNewTag("");
    setFormErrors({});
    setEditingContact(null);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = "Please enter a valid phone number";
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    // Check for duplicate phone numbers
    const existingContact = contacts.find(c => 
      c.phone === formData.phone && c._id !== editingContact?._id
    );
    if (existingContact) {
      errors.phone = "A contact with this phone number already exists";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;
    
    try {
      if (editingContact) {
        // Update existing contact via API using secure service
        const updatedContact = await apiService.updateContact(editingContact._id, {
          ...formData,
          phone: formData.phone.trim(),
          name: formData.name.trim(),
          email: formData.email?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          companyId: user.companyId // Ensure contact belongs to user's company
        }) as Contact;
        
        setContacts(prev => prev.map(c => 
          c._id === editingContact._id ? updatedContact : c
        ));
      } else {
        // Add new contact via API using secure service
        const newContact = await apiService.createContact({
          ...formData,
          phone: formData.phone.trim(),
          name: formData.name.trim(),
          email: formData.email?.trim() || undefined,
          notes: formData.notes?.trim() || undefined,
          companyId: user.companyId // Ensure contact belongs to user's company
        }) as Contact;
        
        setContacts(prev => [newContact, ...prev]);
      }
      
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error saving contact:", error);
      showError("Error saving contact. Please try again.");
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      phone: contact.phone,
      name: contact.name,
      email: contact.email || "",
      tags: [...(contact.tags || [])],
      notes: contact.notes || ""
    });
    setShowAddModal(true);
  };

  const handleDelete = async (contactId: string) => {
    try {
      await apiService.deleteContact(contactId);
      
      setContacts(prev => prev.filter(c => c._id !== contactId));
      setShowDeleteModal(false);
      setDeletingContact(null);
      showError('Contact deleted successfully');
    } catch (error) {
      console.error("Error deleting contact:", error);
      showError("Error deleting contact. Please try again.");
    }
  };

  const toggleContactStatus = async (contactId: string) => {
    if (!user) return;
    
    try {
      const contact = contacts.find(c => c._id === contactId);
      if (!contact) return;
      
      const currentStatus = contact.status || "active";
      const newStatus = currentStatus === "active" ? "blocked" : "active";
      
      const updatedContact = await apiService.updateContact(contactId, { 
        ...contact, 
        status: newStatus,
        companyId: user.companyId // Ensure security
      }) as Contact;
      
      setContacts(prev => prev.map(c => 
        c._id === contactId ? { ...c, status: newStatus as "active" | "blocked" } : c
      ));
      showError(`Contact ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      console.error("Error updating contact status:", error);
      showError(`Error updating contact status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTagsUpdate = async () => {
    if (!tagsEditingContact || !user) return;
    
    try {
      const updatedContact = await apiService.updateContact(tagsEditingContact._id, { 
        ...tagsEditingContact, 
        tags: tagsFormData.selectedTags,
        companyId: user.companyId // Ensure security
      }) as Contact;
      
      setContacts(prev => prev.map(c => 
        c._id === tagsEditingContact._id ? updatedContact : c
      ));
      
      setShowTagsModal(false);
      setTagsEditingContact(null);
      setTagsFormData({ selectedTags: [], newTag: "" });
      showError('Contact tags updated successfully');
    } catch (error) {
      console.error("Error updating contact tags:", error);
      showError(`Error updating contact tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const addNewTag = () => {
    const newTag = tagsFormData.newTag.trim();
    if (newTag && !tagsFormData.selectedTags.includes(newTag)) {
      setTagsFormData(prev => ({
        ...prev,
        selectedTags: [...prev.selectedTags, newTag],
        newTag: ""
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagsFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const toggleExistingTag = (tag: string) => {
    setTagsFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  // Excel import/export functions
  const downloadTemplate = () => {
    const csvContent = [
      ["Name", "Phone", "Email", "Tags", "Notes"],
      ["John Doe", "+1234567890", "john@example.com", "customer,vip", "Important client"],
      ["Jane Smith", "+0987654321", "jane@example.com", "lead", "Interested in premium plan"],
      ["Bob Johnson", "+1122334455", "", "prospect", "Follow up next week"]
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = async () => {
    if (!importFile || !user) return;
    
    setImporting(true);
    setImportProgress(0);
    
    try {
      const text = await importFile.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());
      
      const newContacts: Contact[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        setImportProgress((i / (lines.length - 1)) * 50); // First 50% for processing
        
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        const contactData: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          contactData[header] = values[index] || "";
        });
        
        // Validate required fields
        if (!contactData.name || !contactData.phone) {
          errors.push(`Row ${i + 1}: Name and phone are required`);
          continue;
        }
        
        // Check for duplicates in existing contacts
        const existingContact = contacts.find(c => c.phone === contactData.phone);
        if (existingContact) {
          errors.push(`Row ${i + 1}: Phone ${contactData.phone} already exists`);
          continue;
        }
        
        // Check for duplicates in current batch
        const duplicateInBatch = newContacts.find(c => c.phone === contactData.phone);
        if (duplicateInBatch) {
          errors.push(`Row ${i + 1}: Phone ${contactData.phone} appears multiple times in file`);
          continue;
        }
        
        try {
          // Save to backend using authenticated API service
          const savedContact = await apiService.createContact({
            name: contactData.name,
            phone: contactData.phone,
            email: contactData.email || undefined,
            tags: contactData.tags ? contactData.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
            notes: contactData.notes || undefined,
            companyId: user.companyId // Ensure contact belongs to user's company
          }) as Contact;
          
          newContacts.push(savedContact);
          
        } catch (saveError: any) {
          console.error(`Error saving contact from row ${i + 1}:`, saveError);
          errors.push(`Row ${i + 1}: Failed to save contact - ${saveError.message || 'Unknown error'}`);
        }
        
        // Update progress for saving (second 50%)
        setImportProgress(50 + ((i / (lines.length - 1)) * 50));
      }
      
      if (newContacts.length > 0) {
        // Add to frontend state
        setContacts(prev => [newContacts, ...prev].flat());
      }
      
      if (errors.length > 0) {
        showError(`Import completed with ${errors.length} errors:\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? '\n... and more' : ''}`);
      } else {
        showError(`Successfully imported ${newContacts.length} contacts!`);
      }
      
      setShowImportModal(false);
      setImportFile(null);
    } catch (error) {
      console.error("Import error:", error);
      showError("Error importing file. Please check the format and try again.");
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  const exportContacts = () => {
    const csvContent = [
      ["Name", "Phone", "Email", "Tags", "Notes", "Status", "Created"],
      ...contacts.map(contact => [
        contact.name,
        contact.phone,
        contact.email || "",
        (contact.tags || []).join(","),
        contact.notes || "",
        contact.status || "active",
        new Date(contact.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Fetch contacts from API with user context
  const fetchContacts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await apiService.getContacts();
      const contactsData = (data as any).contacts || [];
      // Filter contacts by user's company for security
      const userContacts = contactsData.filter((contact: Contact) => 
        contact.companyId === user.companyId || !contact.companyId // Include legacy contacts without companyId
      );
      setContacts(userContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
      showError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.phone.includes(searchTerm) ||
                         (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = !selectedTag || (contact.tags && contact.tags.includes(selectedTag));
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags || [])));

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#2A8B8A] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full space-y-6">
      {/* Header Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A8B8A] via-[#238080] to-[#1d6a6a] p-8 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Contacts</h1>
              <p className="text-white/80 text-lg">Manage your WhatsApp contacts and build stronger customer relationships</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={downloadTemplate}
                className="bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MdDownload className="w-5 h-5" />
                Template
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MdUpload className="w-5 h-5" />
                Import
              </button>
              <button
                onClick={exportContacts}
                className="bg-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MdDownload className="w-5 h-5" />
                Export
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-white text-[#2A8B8A] px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <MdAdd className="w-5 h-5" />
                Add Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards with Modern Design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-[#2A8B8A]/10 rounded-xl group-hover:bg-[#2A8B8A]/20 transition-colors duration-200">
              <MdPerson className="w-6 h-6 text-[#2A8B8A]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{contacts.length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">Total Contacts</p>
          <p className="text-xs text-gray-600 mt-1">All registered users</p>
        </div>

        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-[#2A8B8A]/10 rounded-xl group-hover:bg-[#2A8B8A]/20 transition-colors duration-200">
              <MdCheckCircle className="w-6 h-6 text-[#2A8B8A]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{contacts.filter(c => (c.status || "active") === "active").length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">Active Users</p>
          <p className="text-xs text-gray-600 mt-1">Currently reachable</p>
        </div>

        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-[#2A8B8A]/10 rounded-xl group-hover:bg-[#2A8B8A]/20 transition-colors duration-200">
              <MdEmail className="w-6 h-6 text-[#2A8B8A]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{contacts.filter(c => c.email).length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">With Email</p>
          <p className="text-xs text-gray-600 mt-1">Email addresses added</p>
        </div>

        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-105">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-[#2A8B8A]/10 rounded-xl group-hover:bg-[#2A8B8A]/20 transition-colors duration-200">
              <MdTag className="w-6 h-6 text-[#2A8B8A]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">{contacts.filter(c => c.tags && c.tags.length > 0).length}</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">Tagged</p>
          <p className="text-xs text-gray-600 mt-1">Organized contacts</p>
        </div>
      </div>

      {/* Search and Filter Bar with Modern Look */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MdClear className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {/* Tag Filter */}
          <div className="lg:w-64">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A8B8A] focus:border-transparent text-gray-900 font-medium transition-all duration-200"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
        
        {(searchTerm || selectedTag) && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                Search: "{searchTerm}"
              </span>
            )}
            {selectedTag && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                Tag: {selectedTag}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Contacts List */}
      {filteredContacts.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-[#2A8B8A] to-[#238080] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <MdPerson className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || selectedTag ? "No contacts found" : "No contacts yet"}
            </h3>
            <p className="text-gray-600 text-lg mb-8">
              {searchTerm || selectedTag 
                ? "Try adjusting your search or filter criteria to find what you're looking for" 
                : "Start building your contact list by adding your first contact. Import from CSV or add manually."}
            </p>
            {!searchTerm && !selectedTag && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-200 inline-flex items-center gap-2 hover:scale-105"
              >
                <MdAdd className="w-5 h-5" />
                Add Your First Contact
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2A8B8A]/10 rounded-lg">
                    <MdPerson className="w-5 h-5 text-[#2A8B8A]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    All Contacts <span className="text-[#2A8B8A]">({filteredContacts.length})</span>
                  </h2>
                </div>
                {(searchTerm || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTag("");
                    }}
                    className="text-sm text-[#2A8B8A] hover:text-[#238080] font-medium flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#2A8B8A]/10 transition-colors"
                  >
                    <MdClear className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {filteredContacts.map((contact, index) => (
                <div key={contact._id} className="group p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent transition-all duration-200">
                  <div className="flex items-start gap-5">
                    {/* Avatar with Animation */}
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-[#2A8B8A] to-[#238080] text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform duration-200">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${
                        (contact.status || "active") === "active" ? "bg-green-500" : "bg-gray-400"
                      }`}></div>
                    </div>
                    
                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2A8B8A] transition-colors">{contact.name}</h3>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
                              (contact.status || "active") === "active" 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : (contact.status || "active") === "blocked" 
                                ? "bg-red-100 text-red-700 border border-red-200" 
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}>
                              {(contact.status || "active").toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-8 h-8 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                                <MdPhone className="w-4 h-4 text-[#2A8B8A]" />
                              </div>
                              <span className="font-medium">{contact.phone}</span>
                            </div>
                            {contact.email && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <div className="w-8 h-8 bg-[#2A8B8A]/10 rounded-lg flex items-center justify-center">
                                  <MdEmail className="w-4 h-4 text-[#2A8B8A]" />
                                </div>
                                <span className="font-medium">{contact.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <MdTag className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-wrap gap-2">
                            {contact.tags.map(tag => (
                              <span key={tag} className="bg-[#2A8B8A]/10 text-[#2A8B8A] px-3 py-1 text-xs font-semibold rounded-full border border-[#2A8B8A]/20">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Notes */}
                      {contact.notes && (
                        <div className="flex items-start gap-2 mb-3 bg-gray-50 border border-gray-200 rounded-xl p-3">
                          <MdNotes className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700 font-medium">{contact.notes}</p>
                        </div>
                      )}
                      
                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <MdPerson className="w-3 h-3" />
                          Added: {new Date(contact.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {contact.last_message_at && (
                          <span className="flex items-center gap-1">
                            <MdMessage className="w-3 h-3" />
                            Last message: {new Date(contact.last_message_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => router.push(`/chats/${encodeURIComponent(contact.phone)}`)}
                          className="bg-[#2A8B8A] text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-[#238080] hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
                        >
                          <MdMessage className="w-4 h-4" />
                          Message
                        </button>
                        <button 
                          onClick={() => toggleContactStatus(contact._id)}
                          className={`px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-lg hover:scale-105 ${
                            (contact.status || "active") === "active" 
                              ? "bg-gray-600 hover:bg-gray-700 text-white" 
                              : "bg-[#2A8B8A] hover:bg-[#238080] text-white"
                          }`}
                        >
                          {(contact.status || "active") === "active" ? <MdBlock className="w-4 h-4" /> : <MdCheckCircle className="w-4 h-4" />}
                          {(contact.status || "active") === "active" ? "Block" : "Unblock"}
                        </button>
                        <button 
                          onClick={() => handleEdit(contact)}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 border border-gray-200"
                        >
                          <MdEdit className="w-4 h-4" />
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setTagsEditingContact(contact);
                            setTagsFormData({
                              selectedTags: [...(contact.tags || [])],
                              newTag: ""
                            });
                            setShowTagsModal(true);
                          }}
                          className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-200 hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 border border-gray-200"
                        >
                          <MdLabel className="w-4 h-4" />
                          Tags
                        </button>
                        <button 
                          onClick={() => {
                            setDeletingContact(contact);
                            setShowDeleteModal(true);
                          }}
                          className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-semibold hover:bg-red-100 hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105 border border-red-200"
                        >
                          <MdDelete className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingContact ? "Edit Contact" : "Add New Contact"}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  className={`w-full border px-3 py-2 text-black focus:outline-none focus:border-[#2A8B8A] ${
                    formErrors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter contact name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  className={`w-full border px-3 py-2 text-black focus:outline-none focus:border-[#2A8B8A] ${
                    formErrors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., +1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  className={`w-full border px-3 py-2 text-black focus:outline-none focus:border-[#2A8B8A] ${
                    formErrors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Tags
                </label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 px-3 py-2 text-black focus:outline-none focus:border-[#2A8B8A]"
                      placeholder="Add a tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-[#2A8B8A] text-white px-4 py-2 font-medium hover:bg-[#238080] transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 px-3 py-1 text-sm flex items-center gap-2"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  className="w-full border border-gray-300 px-3 py-2 text-black focus:outline-none focus:border-[#2A8B8A] resize-none"
                  rows={3}
                  placeholder="Add any notes about this contact..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-[#2A8B8A] text-white px-6 py-2 font-medium hover:bg-[#238080] transition-colors"
                >
                  {editingContact ? "Update Contact" : "Add Contact"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Import Contacts</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setImportProgress(0);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-gray-600 mb-4">
                  Upload a CSV file with contacts. Make sure it includes columns: Name, Phone, Email, Tags, Notes
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <MdCloudUpload className="w-12 h-12 text-gray-400" />
                    <div>
                      <p className="text-lg font-medium text-gray-900">Choose file to upload</p>
                      <p className="text-sm text-gray-500">CSV, XLSX, or XLS files</p>
                    </div>
                  </label>
                </div>
                {importFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {importFile.name}
                  </p>
                )}
              </div>

              {importing && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Importing contacts...</p>
                  <div className="w-full bg-gray-200 h-2">
                    <div 
                      className="bg-[#2A8B8A] h-2 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{Math.round(importProgress)}% complete</p>
                </div>
              )}

              <div className="flex justify-between gap-3 pt-4">
                <button
                  onClick={downloadTemplate}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 font-medium hover:bg-gray-700 transition-colors text-sm"
                >
                  Download Template
                </button>
                <button
                  onClick={handleFileImport}
                  disabled={!importFile || importing}
                  className="flex-1 bg-[#2A8B8A] text-white py-2 px-4 font-medium hover:bg-[#238080] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {importing ? "Importing..." : "Import"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tags Management Modal */}
      {showTagsModal && tagsEditingContact && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Manage Tags - {tagsEditingContact.name}
                </h2>
                <button
                  onClick={() => {
                    setShowTagsModal(false);
                    setTagsEditingContact(null);
                    setTagsFormData({ selectedTags: [], newTag: "" });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Current Tags */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Tags</h3>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-300 rounded-lg bg-gray-50">
                  {tagsFormData.selectedTags.length === 0 ? (
                    <span className="text-gray-500 text-sm">No tags selected</span>
                  ) : (
                    tagsFormData.selectedTags.map(tag => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <MdClose className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Add New Tag */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Tag</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter new tag..."
                    value={tagsFormData.newTag}
                    onChange={(e) => setTagsFormData(prev => ({ ...prev, newTag: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addNewTag();
                      }
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                  <button
                    onClick={addNewTag}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <MdAdd className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Existing Tags */}
              {allTags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Available Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleExistingTag(tag)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          tagsFormData.selectedTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTagsModal(false);
                    setTagsEditingContact(null);
                    setTagsFormData({ selectedTags: [], newTag: "" });
                  }}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 font-medium hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTagsUpdate}
                  className="flex-1 bg-[#2A8B8A] text-white py-2 px-4 font-medium hover:bg-[#238080] transition-colors"
                >
                  Update Tags
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingContact && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingContact(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <MdDelete className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900 font-medium">
                    Are you sure you want to delete this contact?
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    <strong>{deletingContact.name}</strong> ({deletingContact.phone})
                  </p>
                  <p className="text-red-600 text-sm mt-2">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingContact(null);
                  }}
                  className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deletingContact._id)}
                  className="bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700 transition-colors rounded-md"
                >
                  Delete Contact
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0  bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Message</h3>
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorMessage("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <MdPerson className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 whitespace-pre-line">
                    {errorMessage}
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowErrorModal(false);
                    setErrorMessage("");
                  }}
                  className="bg-[#2A8B8A] text-white px-6 py-2 font-medium hover:bg-[#238080] transition-colors rounded-md"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
