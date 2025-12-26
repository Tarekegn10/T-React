import React from "react";
import Header from "../assets/header";
import Footer from "../assets/footer";

function About() {
    return (
        <>
            <main className="about-main">
                <div className="about-container">
                    <section className="about-section">
                        <div className="about-text">
                            <h2>About Gentleman's Step</h2>
                            <p>Founded in 2024, we are dedicated to redefining footwear for the modern man. We believe that style should never come at the expense of comfort.</p>
                            <a href="/contact" className="btn">Get in Touch</a>
                        </div>
                        <div className="about-image">
                            <img src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=800&q=80" alt="Shoe Crafting" />
                        </div>
                    </section>

                    <section>
                        <h2 style={{ textAlign: "center", marginBottom: "3rem", color: "var(--primary)" }}>Our Core Values</h2>
                        <div className="values-grid">
                            <div className="value-card">
                            <h3>Uncompromising Quality</h3>
                                <p style={{ color: "var(--text-light)" }}>We source the finest leathers and materials from around the globe to ensure every pair stands the test of time.</p>
                        </div>
                            <div className="value-card">
                            <h3>Timeless Design</h3>
                                <p style={{ color: "var(--text-light)" }}>Our designs blend classic silhouettes with modern aesthetics, creating shoes that are relevant today and tomorrow.</p>
                        </div>
                            <div className="value-card">
                            <h3>Customer First</h3>
                                <p style={{ color: "var(--text-light)" }}>Your satisfaction is our priority. We strive to provide an exceptional shopping experience from browsing to unboxing.</p>
                        </div>
                    </div>
                </section>
                </div>
            </main>
        </>
    );
}
export default About;