import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; 


ReactDOM.createRoot(document.getElementById('root')!).render(
  // Remove StrictMode in dev to avoid double effect mount/cleanup closing WS
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
