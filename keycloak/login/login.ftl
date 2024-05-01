<!DOCTYPE html>
<html>
<head>
<title>Login</title>
</head>
<body>
<h1>Custom Login Page</h1>
<form action="${url.loginAction}" method="post">
        <input type="hidden" name="authenticity_token" value="${csrf}">

        <div>
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
        </div>
        <div>
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <div>
            <input type="submit" value="Login">
        </div>
    </form>
</body>
</html>
