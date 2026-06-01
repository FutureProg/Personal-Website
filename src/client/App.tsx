import { GithubActivityView } from "./views/GithubActivityView";

export const App = () => {
    return (
        <>
            <header>
                <img
                    src="/images/icon.png"
                    alt="website logo, a butterfly with the wings spelling N and M"
                />
            </header>

            <main className="content">
                <section className="about">
                    <img
                        className="collage"
                        src="/images/Collage.png"
                        alt="collage of images showing Nick's hobbies, the city of Burlington, and his dog charlie"
                    />
                    <div className="about-content">
                        <h1>Nick Morrison</h1>
                        <p>
                            Using my understanding of software development,
                            machine learning, business, and design, I am working
                            towards making a positive impact on people by{" "}
                            <i>Building what Matters</i>.
                        </p>
                        <div className="bullets">
                            <div className="bullet-heading">
                                <b>Passions:</b>
                            </div>
                            <ul>
                                <li>🏙️ urban design</li>
                                <li>🌲 environmentalism</li>
                            </ul>
                            <div className="bullet-heading">
                                <b>Hobbies:</b>
                            </div>
                            <ul>
                                <li>🎮 video games</li>
                                <li>✍️ writing</li>
                                <li>💖 volunteering</li>
                            </ul>
                        </div>
                        <p>
                            <strong>Email:</strong>{" "}
                            <a href="mailto:nickmorrison09@gmail.com">
                                nickmorrison09@gmail.com
                            </a>
                            <br />
                            <strong>Github:</strong>{" "}
                            <a href="https://github.com/FutureProg">
                                github.com/FutureProg
                            </a>
                            <br />
                        </p>
                    </div>
                </section>
                <section className="github-activity">
                    <GithubActivityView />
                </section>
            </main>            
        </>
    );
};
