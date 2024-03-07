const access_token = localStorage.getItem('access_token');
fetch('/admin/auth', {
    method: 'POST',
    headers: {
        'token': access_token,
        'Content-Type': 'application/json'
    },
})
.then(response => response.json())
.then(data => {
    if (data.message === 'Unauthorized') {
        alert('You are not authorized to access this page');
        window.location.href = '/admin';
    } else {
        document.getElementById('userListContainer').style.display = 'block';
    }
})
.catch(error => console.error('Error:', error));