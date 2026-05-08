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
  document.querySelector('#email-view').innerHTML = '';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // fetch emails
  try {
    const response = await fetch(`/emails/${mailbox}`)
    const emails = await response.json()
    // console.log(emails)

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
        view_email(email.id, mailbox);
      });

      document.querySelector('#emails-view').append(emailDiv);
    });
    
  } catch(error) {
      console.log("Error: ", error)
  }
}

async function view_email(id, mailbox) {

  // Hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Show single email view
  document.querySelector('#email-view').style.display = 'block';

  // Clear old email content
  const emailView = document.querySelector('#email-view');
  emailView.innerHTML = '';

  // fetch single email
  try {
    const response = await fetch(`/emails/${id}`);
    const email = await response.json();
    
    console.log(email);
    // update email has been read as true 
    await fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true
      })
    })

    // handle seperator - clean email body 
    const bodyRaw = document.querySelector("#compose-body").value;
    const separator = "Reply below this line";
    const body = bodyRaw.includes(separator)
      ? bodyRaw.split(separator)[1].trim()
      : bodyRaw;

    // email container 
    const container = document.createElement('div');

    container.innerHTML = `
      <strong>From:</strong> ${email.sender}<br>
      <strong>To:</strong> ${email.recipients.join(', ')}<br>
      <strong>Subject:</strong> ${email.subject}<br>
      <strong>Timestamp:</strong> ${email.timestamp}
      <hr>
      <p>${email.body}</p>
    `;



    // back button
    const backBtn = document.createElement("button")
    backBtn.innerHTML = "Back"
    backBtn.addEventListener("click", () => {
      load_mailbox(mailbox)
    })
    container.appendChild(backBtn)

    // archive button
    if(mailbox !== "sent"){
      const archiveBtn = document.createElement("button");
      archiveBtn.innerHTML = email.archived ? "Unarchive" : "Archive";
      archiveBtn.style.marginLeft = '10px';

      archiveBtn.addEventListener("click", async() => {
        await toggle_archive(email.id, !email.archived)

        await load_mailbox(mailbox)
      })

      container.appendChild(archiveBtn)
    }

    // reply button
    if(mailbox !== "sent" && mailbox !== "archive"){
      const replyBtn = document.createElement("button");
      replyBtn.innerHTML = "Reply";
      replyBtn.style.marginLeft = '10px';
      replyBtn.addEventListener("click", () => {
      prepare_reply(email)
    })
    container.appendChild(replyBtn)
    }

    // finally render everything
    emailView.append(container)
    
  } catch (error) {
    console.log("Error: ", error)
    emailView.innerHTML = '<h3>Error loading email.</h3>'
  }
}

async function toggle_archive(id, shouldArchive) {
  try {
    const response = await fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: shouldArchive
      })
    })

    if(!response.ok) {
      const result = await response.json()
      console.log(result.error)
    }
  } catch (error) {
    console.log("Archive error: ", error)
  }
}

function prepare_reply(email) {  
  // Open compose view first
  compose_email();

  // pre populate To:
  document.querySelector("#compose-recipients").value = email.sender;

  // Subject handling (avoid duplicate "Re:")
  let subject = email.subject

  if(!subject.startsWith("Re:")) {
    subject = `Re: ${subject}`
  }
  document.querySelector("#compose-subject").value = subject

  // Body template
  document.querySelector("#compose-body").value =
`On ${email.timestamp} ${email.sender} wrote:

${email.body}

---------------------------
Reply below this line
---------------------------

`;
}