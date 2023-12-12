import React, { useState } from "react";
import Header from "./Header";

const Login = () => {
  const [isSignInForm, setIsSignInForm] = useState(true);

  const toggleSignInForm = () => {
    setIsSignInForm(!isSignInForm);
  };

  return (
    <div>
      <Header />
      <div className="absolute">
        <img
          src="https://assets.nflxext.com/ffe/siteui/vlv3/b4c7f092-0488-48b7-854d-ca055a84fb4f/5b22968d-b94f-44ec-bea3-45dcf457f29e/IN-en-20231204-popsignuptwoweeks-perspective_alpha_website_large.jpg"
          alt="Logo"
        />
      </div>
      <form className="w-4/12 absolute rounded-md p-12 bg-black my-36 mx-auto right-0 left-0 text-white bg-opacity-80">
        <h1 className="font-bold text-3xl py-4">
          {isSignInForm ? "Sign In" : "Sign Up"}
        </h1>
        {!isSignInForm && <input
          type="text"
          placeholder="Full Name"
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />}
        <input
          type="text"
          placeholder="Email Address"
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />
        <input
          type="password"
          placeholder="Password"
          className="p-4 my-4 bg-[#333] rounded-md w-full"
        />
        <button className="p-4 my-6 bg-red-700 rounded-md w-full">
          {isSignInForm ? "Sign In" : "Sign Up"}
        </button>
        <p onClick={toggleSignInForm} className="py-4 m-2 cursor-pointer">
          {isSignInForm ? (
            <p>
              New to Netflix? <u>Sign Up here</u>
            </p>
          ) : (
            <p>
              Already Registered? <u>Sign In Now</u>
            </p>
          )}
        </p>
      </form>
    </div>
  );
};

export default Login;
