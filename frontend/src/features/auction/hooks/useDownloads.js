import axios from 'axios';
import { API_BASE_URL } from '../../../config';

// Blob download helpers for the results (Excel/CSV), sale log and JSON backup.
// Extracted verbatim from UnifiedDashboard — behavior is intentionally unchanged.
export default function useDownloads({ showSuccess, showError }) {
  const downloadResults = async (format = 'excel') => {
    try {
      const endpoint =
        format === 'csv'
          ? `${API_BASE_URL}/api/download-results-csv`
          : `${API_BASE_URL}/api/download-results`;
      const response = await axios.get(endpoint, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = `auction-results.${format === 'csv' ? 'csv' : 'xlsx'}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess(`${format.toUpperCase()} results downloaded successfully`);
    } catch (error) {
      console.error('Error downloading results:', error);
      showError(`Error downloading ${format} results`);
    }
  };

  const downloadSaleLog = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-sale-log`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'sale-log.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) filename = filenameMatch[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess('Sale log downloaded successfully');
    } catch (error) {
      console.error('Error downloading sale log:', error);
      showError('Error downloading sale log');
    }
  };

  const downloadBackup = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download-backup`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'auction-backup.json';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch) filename = filenameMatch[1].replace(/['"]/g, '');
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      showSuccess('Backup downloaded successfully');
    } catch (error) {
      console.error('Error downloading backup:', error);
      showError('Error downloading backup');
    }
  };

  return { downloadResults, downloadSaleLog, downloadBackup };
}
