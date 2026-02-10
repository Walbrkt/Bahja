export default function VideoHero() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
      <video
        controls
        width={960}
        poster="/videos/demo-hero-poster.svg"
        style={{ borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
      >
        <source src="/videos/demo-hero.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
