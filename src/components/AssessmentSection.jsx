const AssessmentSection = ({ title, value }) => (
  <div style={{ margin: '10px 0' }}>
    <strong>{title}</strong>: {Number(value).toFixed(2).replace(/\.00$/, '')}% complete
    <div style={{ height: '10px', background: '#ccc', marginTop: '4px' }}>
      <div style={{
        width: `${value}%`,
        height: '100%',
        backgroundColor: '#4CAF50'
      }}></div>
    </div>
  </div>
);

export default AssessmentSection;
