let user = $state(null); //help with ai

export function getUser() {
	return user;
}

export function setUser(newUser) {
	user = newUser;
}

export function clearUser() {
	user = null;
}
