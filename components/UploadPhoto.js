import React, { useState } from "react";
import { motion } from "framer-motion";
import GooglePhotosPicker from "./GooglePhotosPicker";

export default function UploadPhoto({ onPhotoSelected }) {
  const [url, setUrl] = useState("");

  const handleUseUrl = () => {
    if (url.trim() !== "") {
      onPhotoSelected(url.trim());
    }
  };

  return (
    <motion.div className="upload-photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2>Paste Public Image URL</h2>
      <input
        type="text"
        placeholder="Enter or paste an image URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <button onClick={handleUseUrl}>Analyze This Image</button>

      <hr />

      <h3>OR Select from Google Photos</h3>
      <GooglePhotosPicker onPhotoSelected={onPhotoSelected} />
    </motion.div>
  );
}
