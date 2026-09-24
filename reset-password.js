(function(){
  "use strict";

  const $=id=>document.getElementById(id);
  const form=$("resetForm"),message=$("resetMessage"),submit=$("resetSubmit"),success=$("resetSuccess"),view=$("resetView");
  const params=new URLSearchParams(location.search);
  const token=String(params.get("token")||"").trim();

  function setMessage(text,type){
    message.textContent=text||"";
    message.className="account-message"+(type?" "+type:"");
  }

  document.querySelectorAll("[data-password-toggle]").forEach(button=>{
    button.addEventListener("click",()=>{
      const input=$(button.dataset.passwordToggle);
      if(!input)return;
      const showing=input.type==="text";
      input.type=showing?"password":"text";
      button.setAttribute("aria-label",showing?"Show password":"Hide password");
      button.setAttribute("title",showing?"Show password":"Hide password");
      button.classList.toggle("is-visible",!showing);
    });
  });

  if(token.length<32){
    view.hidden=true;
    const requestPanel=$("resetRequest");
    requestPanel.hidden=false;
    const email=String(sessionStorage.getItem("saiResetEmail")||"").trim();
    $("resetRequestEmail").textContent=email?"Account email: "+email:"Enter your account email on the login page first.";
    const whatsapp=$("resetWhatsApp");
    if(!email){
      whatsapp.hidden=true;
    }else{
      const text="Hello Sai Graphic Designs, I need a password reset link for my account ("+email+"). Please verify my request and send me a secure one-time link.";
      whatsapp.href="https://wa.me/916381128781?text="+encodeURIComponent(text);
    }
  }

  const newPassword=$("newPassword"),confirmPassword=$("confirmPassword");
  function validateConfirmation(){
    const mismatched=Boolean(confirmPassword.value&&newPassword.value!==confirmPassword.value);
    confirmPassword.setCustomValidity(mismatched?"Passwords do not match.":"");
    confirmPassword.setAttribute("aria-invalid",mismatched?"true":"false");
    if(mismatched)setMessage("New password and confirm password do not match.","error");
    else if(message.classList.contains("error"))setMessage("");
  }
  newPassword.addEventListener("input",validateConfirmation);
  confirmPassword.addEventListener("input",validateConfirmation);

  form.addEventListener("submit",async event=>{
    event.preventDefault();
    if(token.length<32)return;

    const password=newPassword.value;
    const confirm=confirmPassword.value;

    if(password.length<8){
      setMessage("Password must be at least 8 characters.","error");
      return;
    }
    if(password!==confirm){
      setMessage("The two passwords do not match.","error");
      return;
    }

    submit.disabled=true;
    submit.textContent="Changing Password…";
    setMessage("Updating your password…");

    try{
      const response=await fetch("/api/auth/reset-password",{
        method:"POST",
        credentials:"same-origin",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({token,password,confirmPassword:confirm})
      });
      let data={};
      try{data=await response.json()}catch{}
      if(!response.ok)throw new Error(data.error||"Unable to reset your password. Please request a new reset link.");

      view.style.display="none";
      success.classList.add("is-visible");
      sessionStorage.removeItem("saiResetEmail");
      history.replaceState({},document.title,location.pathname);
    }catch(error){
      setMessage(error.message||"Unable to reset your password.","error");
      submit.disabled=false;
      submit.textContent="Change Password";
    }
  });
})();
