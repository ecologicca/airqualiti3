import React, { useState, useEffect } from 'react';
import { InstagramEmbed } from 'react-social-embed';

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);
  const instagramHandle = 'airunfiltered';

  return (
    <div className="instagram-feed-container">
      <div className="feed-header">
        <h2 className="card-title">Air Unfiltered</h2>
        <a 
          href={`https://www.instagram.com/${instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="follow-button"
        >
          Follow @{instagramHandle}
        </a>
      </div>
      <div className="feed-grid">
        <InstagramEmbed 
          url={`https://www.instagram.com/${instagramHandle}`}
          clientAccessToken={process.env.REACT_APP_INSTAGRAM_TOKEN}
          maxWidth={328}
          hideCaption={false}
          containerTagName="div"
          protocol=""
          injectScript
          onLoading={() => {}}
          onSuccess={() => {}}
          onAfterRender={() => {}}
          onFailure={() => {}}
        />
      </div>
    </div>
  );
};

export default InstagramFeed; 