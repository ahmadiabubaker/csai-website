const hamMenu = document.querySelector(".ham-menu");

const offScreenMenu = document.querySelector(".off-screen-menu");

function changeActive(){
  hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
}

hamMenu.addEventListener("click", changeActive)

// close sidebar when clicking outside
document.addEventListener('click', (e) => {
  if (
    offScreenMenu.classList.contains('active') &&
    !offScreenMenu.contains(e.target) &&
    !hamMenu.contains(e.target)
  ) {
    offScreenMenu.classList.remove('active');
    hamMenu.classList.remove("active");
  }
});