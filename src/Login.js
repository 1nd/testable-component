import React, { useState } from "react";
import isEmail from "validator/lib/isEmail";
import { loginMutation } from "./api";

const INITIAL_ERRORS = [];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [loggedInUser, setLoggedInUser] = useState(undefined);

  const changeEmail = event => {
    setEmail(event.target.value);
    setErrors(INITIAL_ERRORS);
  };

  const changePassword = event => {
    setPassword(event.target.value);
    setErrors(INITIAL_ERRORS);
  };

  const validate = () => {
    let newErrors = [];

    if (!email) {
      newErrors.push("Email is required");
    } else if (!isEmail(email)) {
      newErrors.push("Invalid email");
    }

    if (!password) {
      newErrors.push("Password is required");
    }

    const hasError = newErrors.length > 0;

    if (hasError) {
      setErrors(newErrors);
    }

    return !hasError;
  };

  const doLogin = async event => {
    event.preventDefault();

    const isValid = validate();

    if (isValid) {
      try {
        const user = await loginMutation({
          email: email,
          password: password
        });

        if (user?.username) {
          setLoggedInUser(user);
        } else {
          setErrors(["Email and password do not match"]);
        }
      } catch (error) {
        setErrors([error.message]);
      }
    }
  };

  if (loggedInUser?.username) {
    return `Welcome ${loggedInUser?.username}`;
  }

  return (
    <form data-testid="login-form" onSubmit={doLogin}>
      <label htmlFor="email">Email</label>
      <input type="email" id="email" value={email} onChange={changeEmail} />
      <label htmlFor="password">Password</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={changePassword}
      />
      <button type="submit">Login</button>
      <ul data-testid="error">
        {errors.map(error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </form>
  );
};

export default Login;
