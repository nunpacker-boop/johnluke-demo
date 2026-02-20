export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-container">
        <div className="footer-left">
          <div style={{ fontSize: "0.95rem", opacity: 0.85 }}>
            © {new Date().getFullYear()} John Luke Foundation
          </div>
        </div>

        <div className="footer-right">
          <p>
            Preserving, interpreting, and promoting the life and work of John Luke through
            scholarship, publishing, education, and digital heritage.
          </p>
        </div>
      </div>
    </footer>
  );
}
