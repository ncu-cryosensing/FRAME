const CheckList = ({ title, items, color }) => {
  const renderMessage = (message) => {
    if (!message) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
          >
            {part}
          </a>
        );
      }

      return part;
    });
  };

  return (
    <div
      style={{
        borderLeft: `5px solid ${color}`,
        padding: "10px",
        margin: "10px 0",
      }}
    >
      <h6>
        {title} ({items.length})
      </h6>

      <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
        {items.map((check, index) => (
          <li key={index}>
            <strong>{check.level}</strong> –{" "}
            <em>{check.principle}</em>:{" "}
            {renderMessage(check.message)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CheckList;