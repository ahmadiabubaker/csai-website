const hamMenu = document.querySelector(".ham-menu");

const offScreenMenu = document.querySelector(".off-screen-menu");

function changeActive(){
  hamMenu.classList.toggle("active");
  offScreenMenu.classList.toggle("active");
}

hamMenu.addEventListener("click", changeActive)

