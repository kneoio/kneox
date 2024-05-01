<!DOCTYPE html>
<html>
<head>
<title>Registration</title>
</head>
<body>
<h1>Register</h1>
<form action="${url.registrationAction}" method="post">
        <input type="hidden" name="authenticity_token" value="${csrf}">

        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div>
            <label for="password-confirm">Confirm Password:</label>
            <input type="password" id="password-confirm" name="password-confirm" required>
        </div>
        <div>
            <button type="submit">Register</button>
        </div>
    </form>
</body>
</html>
