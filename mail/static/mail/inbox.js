document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector("#compose-form").onsubmit = async (event) => {
    event.preventDefault();

    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    try {
      const response = await fetch("/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recipients,
          subject,
          body
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(result);
        load_mailbox("sent");
      } else {
        console.log(result.error);
      }

    } catch (error) {
      console.log("Error:", error);
    }
  };

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

  async function load_mailbox(mailbox) {
    console.count("load_mailbox called");
  
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';

    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

    // fetch emails
    try {
      const response = await fetch(`/emails/${mailbox}`)

      const emails = await response.json()

      console.log(emails)

      // Required structure (subject + sender + timestamp)
      emails.forEach(email => {
        const emailDiv = document.createElement("div")

        emailDiv.innerHTML = `
          <strong>${email.sender}</strong><br>
          ${email.subject}<br>
          <small>${email.timestamp}</small>
        `;

        // Styling (IMPORTANT for spec)
        emailDiv.style.border = "1px solid black";
        emailDiv.style.padding = "10px";
        emailDiv.style.margin = "5px";
        emailDiv.style.cursor = "pointer";
        
        // Read / unread styling (CS50 requirement)
        if (email.read) {
          emailDiv.style.backgroundColor = '#e0e0e0';
        } else {
          emailDiv.style.backgroundColor = '#ffffff';
        }

        // CLICK → next phase (view email)
        emailDiv.addEventListener('click', () => {
          view_email(email.id);
        });

        document.querySelector('#emails-view').append(emailDiv);
      });
      
    } catch(error) {
        console.log("Error: ", error)

    }
  }