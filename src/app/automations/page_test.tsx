"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { apiService } from '../services/apiService';
import Enhanced4StepAutomationBuilder from './Enhanced4StepAutomationBuilder';

// Test simple component first
function TestAutomationsPage() {
  return <div>Test page works</div>;
}

const ProtectedTestPage = () => {
  return (
    <ProtectedRoute>
      <TestAutomationsPage />
    </ProtectedRoute>
  );
};

export default ProtectedTestPage;
