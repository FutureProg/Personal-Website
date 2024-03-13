import './App.css';
import collageImage from './images/Collage.png'
import icon from './images/icon.png'

function App() {
  return (
    <div className="App">
      <nav>
        <img src={icon} alt='website logo, a butterfly with the wings spelling N and M'/>
        <ul>
          <li>
            <a href='https://blog.nickmorrison.me/'>Blog</a>
          </li>
        </ul>
      </nav>

      <div className="content">

        {/* About Section */}
        <h1>Nick Morrison</h1>
        <div className='about'>
          <div className='about-content'>
          <img className='collage' src={collageImage} alt='collage of images showing Nicks hobbies, the city of Burlington, and his dog charlie' />
            <p>
              Using my understanding analytics, machine learning, business, software development, and design, I am working towards making a positive impact on people by <i>Building what Matters</i>.
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
                <strong>Occupations:</strong>
                <ul>
                  <li>🤓 software developer</li>
                  <li>🤓 data scientist</li>
                </ul>
              </p>
            </div>
            <p>
              <strong>Email:</strong> <a href='mailto:nickmorrison09@gmail.com'>nickmorrison09@gmail.com</a><br/>
              <strong>Github:</strong> <a href="https://github.com/FutureProg">github.com/FutureProg</a><br/>
              <b>Resumes:</b><br/>
              <a href='Resume_software.pdf'>Software Resume</a><br/>
              <a href='Resume_data.pdf'>Data Scientist Resume</a>
            </p>
          </div>
          {/* <div className='collage'> */}
            
          {/* </div> */}
        </div>
      </div>
    </div>
  );
}

export default App;
