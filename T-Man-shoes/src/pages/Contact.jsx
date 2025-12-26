import React from "react";
import Header from "../assets/header";
import Footer from "../assets/footer";
function Contact() {
    return (
        <>

            <main className="contact-main">
                <section className="page-header">
                    <h1>Get in Touch</h1>
                    <p>Have questions about our footwear? We're here to help you step up your game.</p>
                </section>

                <section className="contact-container">
                    <div className="contact-form">
                        <form>
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" placeholder="Your Name" />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" placeholder="your@email.com" />
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea rows="5" placeholder="How can we help?"></textarea>
                            </div>
                            <button type="submit" className="btn">Send Message</button>
                        </form>
                    </div>

                    <div className="info-card">
                        <div className="info-item">
                            <div className="icon-box">
                                <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            </div>
                            <div className="info-content">
                                <h3>Visit Our Store</h3>
                                <p>123 Gentleman's Ave<br/>New York, NY 10012</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="icon-box">
                                <svg viewBox="0 0 24 24"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-2.2 2.2a15.057 15.057 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1.01A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"/></svg>
                            </div>
                            <div className="info-content">
                                <h3>Call Us</h3>
                                <p>+1 (555) 123-4567<br/>Mon-Fri, 9am - 6pm EST</p>
                            </div>
                        </div>
                        <div className="info-item">
                            <div className="icon-box">
                                <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                            </div>
                            <div className="info-content">
                                <h3>Email Us</h3>
                                <p>support@gentlemansstep.com<br/>sales@gentlemansstep.com</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
export default Contact;