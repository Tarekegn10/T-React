function Header() {
    return (
      <header>
        <div className="logo">LOGO</div>
        <div className="search-bar">
            <input type="text" placeholder="Search..."/>
        </div>
        <nav>
            <a href="#">Home</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
        </nav>    
    </header>
    );
  }
  
  export default Header;