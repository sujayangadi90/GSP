const API_URL = 'http://localhost:5000/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gsp_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const headers = getHeaders();
  
  // If we are sending FormData (for image upload), don't set Content-Type header
  const isFormData = options.body instanceof FormData;
  if (isFormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }

  // Handle file/blob downloads e.g. CSV exports
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  return response.json();
};

export const authApi = {
  login: (email, password) => 
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () => 
    apiCall('/auth/profile', { method: 'GET' }),
};

export const cmsApi = {
  getContent: () => 
    apiCall('/cms', { method: 'GET' }),
  updateContent: (key, value) => 
    apiCall(`/cms/${key}`, {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),
};

export const serviceApi = {
  getCategories: () => 
    apiCall('/services/categories', { method: 'GET' }),
  createCategory: (data) => 
    apiCall('/services/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) => 
    apiCall(`/services/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) => 
    apiCall(`/services/categories/${id}`, { method: 'DELETE' }),

  getServices: () => 
    apiCall('/services', { method: 'GET' }),
  getServiceBySlug: (slug) => 
    apiCall(`/services/slug/${slug}`, { method: 'GET' }),
  createService: (data) => 
    apiCall('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateService: (id, data) => 
    apiCall(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteService: (id) => 
    apiCall(`/services/${id}`, { method: 'DELETE' }),
};

export const brandApi = {
  getBrands: () => 
    apiCall('/brands', { method: 'GET' }),
  createBrand: (data) => 
    apiCall('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBrand: (id, data) => 
    apiCall(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBrand: (id) => 
    apiCall(`/brands/${id}`, { method: 'DELETE' }),
};

export const testimonialApi = {
  getTestimonials: () => 
    apiCall('/testimonials', { method: 'GET' }),
  getAllTestimonials: () => 
    apiCall('/testimonials/all', { method: 'GET' }),
  createTestimonial: (data) => 
    apiCall('/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTestimonial: (id, data) => 
    apiCall(`/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTestimonial: (id) => 
    apiCall(`/testimonials/${id}`, { method: 'DELETE' }),
};

export const inquiryApi = {
  submit: (data) => 
    apiCall('/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getInquiries: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/inquiries?${query}`, { method: 'GET' });
  },
  deleteInquiry: (id) => 
    apiCall(`/inquiries/${id}`, { method: 'DELETE' }),
  exportInquiries: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const blob = await apiCall(`/inquiries/export?${query}`, { method: 'GET' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inquiries_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },
};

export const uploadApi = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiCall('/upload', {
      method: 'POST',
      body: formData,
    });
  },
};
