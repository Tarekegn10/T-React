import Header from "../assets/header";
import Footer from "../assets/footer";
function Home() {
  return (
    <>
    <Header />

    <main>
        <div className="image-transition">
            <div className="animated-box">
                <div className="track">
                    <img src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80" alt="Shoe 3" className="slide-img"/>
                    <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80" alt="Shoe 4" className="slide-img"/>
                    <img src="https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=1200&q=80" alt="Shoe 5" className="slide-img"/>
                    <img src="https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80" alt="Shoe 3" className="slide-img"/>
                    <img src="https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80" alt="Shoe 4" className="slide-img"/>
                    <img src="https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=1200&q=80" alt="Shoe 5" className="slide-img"/>
                </div>
            </div>
        </div>
        <section className="hero-section">
            <div className="hero">
                <div className="hero-text">
                    <h1>Air Jordan 1 High</h1>
                    <h2>Brand: Nike</h2>
                    <h2>Release: Oct 25, 2023</h2>
                    <p className="discribtion">The iconic sneaker that started it all. Featuring premium leather and the classic Wings logo.</p>
                    <button className="btn">Shop Now</button>
                </div>
                <img src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" alt="Air Jordan 1" className="main-img"/>
            </div>
            <div className="hero">
                <img src="https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80" alt="Yeezy Boost" className="main-img"/>
                <div className="hero-text">
                    <h1>Ultraboost Light</h1>
                    <h2>Brand: Adidas</h2>
                    <h2>Release: Feb 15, 2024</h2>
                    <p class="discribtion">Experience epic energy with the lightest Ultraboost ever. Responsive cushioning for every run.</p>
                    <button class="btn">Shop Now</button>
                </div>
            </div>
            <div className="hero">
                <div className="hero-text">
                    <h1>RS-X Effect</h1>
                    <h2>Brand: Puma</h2>
                    <h2>Release: Mar 10, 2024</h2>
                    <p className="discribtion">Future-retro silhouette with progressive aesthetic and angular details.</p>
                    <button className="btn">Shop Now</button>
                </div>
                <img src="https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80" alt="Puma RS-X" className="main-img"/>
            </div>
        </section>

        <section className="product-grid">
            <div> 
                <h1>Nike Collection</h1>
                <div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=60" alt="Nike Air Force 1" className="small-img"/>
                        <h3>Air Force 1</h3>
                        <button className="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=500&q=60" alt="Nike Dunk" className="small-img"/>
                        <h3>Dunk Low</h3>
                        <button class="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=500&q=60" alt="Nike Air Max" className="small-img"/>
                        <h3>Air Max 90</h3>
                        <button className="btn-small">View</button>
                    </div>
                </div>
            </div>
        </section>
        <section className="product-grid">    
            <div> 
                <h1>Adidas Originals</h1>
                <div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=500&q=60" alt="Stan Smith" className="small-img"/>
                        <h3>Stan Smith</h3>
                        <button className="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=500&q=60" alt="Superstar" className="small-img"/>
                        <h3>Superstar</h3>
                        <button className="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=500&q=60" alt="NMD" className="small-img"/>
                        <h3>NMD R1</h3>
                        <button className="btn-small">View</button>
                    </div>
                </div>
            </div>
        </section>
        <section className="product-grid">
            <div> 
                <h1>Formal & Boots</h1>
                <div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=500&q=60" alt="Oxford" className="small-img"/>
                        <h3>Classic Oxford</h3>
                        <button className="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=500&q=60" alt="Chelsea Boot" className="small-img"/>
                        <h3>Chelsea Boot</h3>
                        <button className="btn-small">View</button>
                    </div>
                    <div className="card">
                        <img src="https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?auto=format&fit=crop&w=500&q=60" alt="Loafer" className="small-img"/>
                        <h3>Suede Loafer</h3>
                        <button className="btn-small">View</button>
                    </div>
                </div>
            </div>
        </section>
    </main>
    </>
  );
}
export default Home;