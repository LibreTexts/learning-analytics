import { ToastContainer as BootstrapToastContainer } from "react-bootstrap";

interface ToastContainerProps {
  children: React.ReactNode;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "absolute",
        bottom: '1rem',
        right: '1rem',
        zIndex: 100,
      }}
    >
      {/* <BootstrapToastContainer style={{ zIndex: 100, bottom: '1rem !important', top: '1rem !important' }} position="top-end">
        {children}
      </BootstrapToastContainer> */}
    {children}
    </div>
  );
};

export default ToastContainer;
