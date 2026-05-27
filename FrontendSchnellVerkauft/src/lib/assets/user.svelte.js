let user = $state(null); //help with ai

export function getUser() {
	return user;
}

export function setUser(newUser) {
	user = newUser;
	console.log(user);
}

export function clearUser() {
	user = null;
}
