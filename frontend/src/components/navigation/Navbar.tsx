import { Link, NavLink, useLocation } from "react-router-dom";

function navClass(isActive: boolean) {
  return `nav-link${isActive ? " nav-link-active" : ""}`;
}

export default function Navbar() {
  const { pathname } = useLocation();
  const isDashboardContext = pathname === "/" || /^\/deviations\/\d+(\/edit)?$/.test(pathname);

  return (
    <header className="topbar">
      <Link className="brand brand-link" to="/" aria-label="AIVOA.AI home">
        <div className="brand-mark">A</div>
        <div>
          <strong>AIVOA.AI</strong>
          <span>Deviation Management</span>
        </div>
      </Link>
      <nav className="nav-links" aria-label="Primary navigation">
        <NavLink
          className={navClass(isDashboardContext)}
          to="/"
          end={false}
        >
          Dashboard
        </NavLink>
        <NavLink
          className={({ isActive }) => navClass(isActive)}
          to="/deviations/new"
        >
          Log Deviation
        </NavLink>
      </nav>
    </header>
  );
}
