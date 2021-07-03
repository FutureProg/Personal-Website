import './App.css';
import collageImage from './images/Collage.png'

function App() {
  return (
    <div className="App">
      <div className="content">

        {/* About Section */}
        <h1>About Nick</h1>
        <div className='about'>
          <div className='about-content'>
            <p>
              Using my understanding analytics, machine learning, business, software development, and design, I am working towards making a positive impact on people.
            </p>
            <div className='bullets'>
              <p>
                <strong>Passions:</strong>
                <ul>
                  <li>🏙️ urban design</li>
                  <li>🌲 environmentalism</li>
                </ul>
              </p>
              <p style={{ gridRow: '1 /span 2', gridColumn: 2 }}>
                <strong>Hobbies:</strong>
                <ul>
                  <li>🎮 video games</li>
                  <li>✍️ writing</li>
                  <li>💖 volunteering</li>
                </ul>
              </p>
              <p>
                <strong>Current Occupation:</strong>
                <ul>
                  <li>🤓 data scientist</li>
                </ul>
              </p>
            </div>
            <p>
              Email: <a href='mailto:nickmorrison09@gmail.com'>nickmorrison09@gmail.com</a><br/>
              Github: <a href="https://github.com/FutureProg">github.com/FutureProg</a><br/>
              <a href='Resume_2.pdf'>Download Resume Here</a>
            </p>
          </div>
          <div className='collage'>
            <img className='collage' src={collageImage} alt='collage of images showing Nicks hobbies, the city of Burlington, and his dog charlie' />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
