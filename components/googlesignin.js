import { useEffect } from "react";

export default function SignIn() {
  useEffect(() => {
    /* global google */
    window.google.accounts.id.initialize({
      client_id: "10109012241-c4humhcnv60n9t3a6gfrvb1d8ku6gksp.apps.googleusercontent.com",  // ⚡ Put your OAuth Client ID here
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-signin-button"),
      {
        theme: "outline",
        size: "large",
      }
    );

    window.google.accounts.id.prompt(); // Optional: Shows the One Tap prompt
  }, []);

  function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    // Now send this token to your backend or verify it
  }

  return (
    <div>
      <h2>Sign In</h2>
      <div id="google-signin-button"></div>
    </div>
  );
}