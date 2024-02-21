'use client';
import BootstrapNavbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";

interface NavbarProps {
  type: "instructor" | "student";
}

const Navbar: React.FC<NavbarProps> = ({ type }) => {
  return (
    <BootstrapNavbar className="px-3 bg-white rounded shadow-sm ">
      <BootstrapNavbar.Brand href="#home">
        {type === "instructor" ? "Instructor" : "Student"} Dashboard
      </BootstrapNavbar.Brand>
      <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BootstrapNavbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link href="/instructor">Course Metrics</Nav.Link>
          {type === "instructor" && <Nav.Link href="#link">Raw Data</Nav.Link>}
        </Nav>
      </BootstrapNavbar.Collapse>
    </BootstrapNavbar>
  );
};

export default Navbar;
