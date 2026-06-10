let user = $state(null); //help with ai
let unreadCount = $state(0);

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
export function getUnreadCount() {
	return unreadCount;
}

export function setUnreadCount(n) {
	unreadCount = n;
}

export function incrementUnread() {
	unreadCount += 1;
}