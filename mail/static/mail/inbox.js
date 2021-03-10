document.addEventListener("DOMContentLoaded", ()=> {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  
  // By default, load the inbox
  load_mailbox('inbox');

  // Button event to send mail
  document.querySelector('form').onsubmit = () =>{
    send_new_email();
    // Return false để don't submit
    return false;
  };
});

async function send_new_email() {
  
  add_spinner();
  console.log('sent new email')
  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  await fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body,
    })
  })
  .then(text => text.json())
  .then(response =>{
    console.log(response)
  })

  remove_spinner();
  load_mailbox('sent');
}

function compose_email() {

  console.log(`load compose`)
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = ``;
  document.querySelector('#compose-subject').value = ``;
  document.querySelector('#compose-body').value = ``;
}

function reply_email(email){

  console.log(`load reply`)
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = `${email.sender}`;
  if (!email.subject.startsWith('Re: ')){
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
  }
  document.querySelector('#compose-body').value = `\n"On ${email.timestamp} ${email.sender} wrote:"\n${email.body}`;

  document.querySelector('#compose-view').style.display = 'block';
  remove_spinner();
}

async function load_mailbox(mailbox) {

  console.log(`load mailbox: ${mailbox}`)
  emails = [];

  switch (mailbox) {
    case 'inbox':

      await fetch('/emails/inbox')
      .then(text => text.json())
      .then(response => {
        emails = response;
        console.log(emails);

        // Show the mailbox name
        document.querySelector('#mailbox-title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`; 
        // load emails
        load_emails(emails);       
      });
      break;
    case 'sent':

      await fetch('/emails/sent')
      .then(text => text.json())
      .then(response => {
        emails = response;
        console.log(emails);

        // Show the mailbox name
        document.querySelector('#mailbox-title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`; 
        // load emails
        load_emails(emails);
      });
      break;
    case 'archive':

      await fetch('/emails/archive')
      .then(text => text.json())
      .then(response => {
        emails = response;
        console.log(emails);

        // Show the mailbox name
        document.querySelector('#mailbox-title').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`; 
        // load emails
        load_emails(emails);
      });
      break;
    default:
      break; 
  }
  show_mailbox();
  remove_spinner();
}
function show_mailbox() {
    // Show the mailbox and hide other views
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#email-detail').style.display = 'none';
}
function load_emails(emails){
  // Show emails 
  document.querySelector('#mailbox-emails').innerHTML = ``;
  if (emails.length > 0){
    for (i in emails) {

      if (emails[i].subject === ''){
        emails[i].subject = '(No Subject)';
      }
      if (emails[i].body === ''){
        emails[i].body = '(No Body)';
      }

      let td_sender = ``;
      let td_subject_body = ``;
      let td_timestamp = ``;

      if (!emails[i].read){
        td_sender = `<td class="col-md-2 fw-bold">${emails[i].sender}</td>`;
        td_subject_body = `<td class="col-md-8"><span class="fw-bold">${emails[i].subject}</span> - <span class="text-muted">${emails[i].body}</span></td>`;
        td_timestamp = `<td class="col-md-2 text-end fw-bold">${emails[i].timestamp}</td>`;
      }
      else{
        td_sender = `<td class="col-md-2">${emails[i].sender}</td>`;
        td_subject_body = `<td class="col-md-8">${emails[i].subject}</td>`;
        td_timestamp = `<td class="col-md-2 text-end">${emails[i].timestamp}</td>`;
      }
      
      const row = `
      <tr class="border" data-email-id=${emails[i].id} id="email-data">
        ${td_sender}
        ${td_subject_body}
        ${td_timestamp}
      </tr>
      `;
      document.querySelector('#mailbox-emails').innerHTML += row;
    }

    document.querySelectorAll('tr').forEach(tr =>{
      tr.onclick = () => {
        load_detail_email(tr.dataset.emailId);
      }
    })
  }
}

async function load_detail_email(email_id){

  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  // document.querySelector('#mailbox-emails').innerHTML = ``;
  document.querySelector('#compose-view').style.display = 'none';
  add_spinner();
  const domContainer = document.querySelector('#email-detail');

  await fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      if (!email.read){
        mark_mail_as_read(email.id);
      }
      
      // ... do something else with email ...
      let email_content = `<h3>Email Detail</h3>`;
      email_content += `<span class="fw-bold">From: </span>${email.sender}<br>`;
      email_content += `<span class="fw-bold">To: </span>${email.recipients.join(',')}<br>`;
      email_content += `<span class="fw-bold">Subject: </span>${email.subject}<br>`;
      email_content += `<span class="fw-bold">Timestamp: </span>${email.timestamp}<br>`;
      email_content += `<button id="btn_reply" class="btn btn-sm btn-outline-primary" data-email-id=${email.id}>Reply</button> `;
      email_content += `<button id="btn_mark_unread" class="btn btn-sm btn-outline-primary" data-email-id=${email.id}>Mark as unread</button> `;
      if (!email.archived){
        email_content += `<button id="btn_archive" class="btn btn-sm btn-outline-primary" data-email-id=${email.id}>Archive</button><hr>`;
      }
      else{
      email_content += `<button id="btn_unarchive" class="btn btn-sm btn-outline-primary" data-email-id=${email.id}>Unarchive</button><hr>`;
      }
      email_content += `${email.body}<br>`;
      domContainer.innerHTML = email_content;

      let btnReply = document.querySelector('#btn_reply');
      let btnArchive = document.querySelector('#btn_archive');
      let btnUnarchive = document.querySelector('#btn_unarchive');
      const btnMarkUnread = document.querySelector('#btn_mark_unread');
      
      btnReply.onclick = () => {
        console.log('btnReply clicked');
        add_spinner();
        reply_email(email);
      }
      if (btnArchive!==null){
        btnArchive.onclick = () => {
          console.log('btnArchive clicked');
          add_spinner();
          archive_email(btnArchive.dataset.emailId);
        }
      }
      else if (btnUnarchive!==null){
        btnUnarchive.onclick = () =>{
          console.log('btnUnarchive clicked');
          add_spinner();
          unarchive_email(btnUnarchive.dataset.emailId);
        }
      }
      btnMarkUnread.onclick = () =>{
        console.log('btnMarkUnread clicked');
        add_spinner();
        mark_mail_as_unread(btnMarkUnread.dataset.emailId);
      }
  });
  remove_spinner();
  document.querySelector('#email-detail').style.display = 'block';
}

async function archive_email(email_id){
  await fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true,
    })
  })
  .then(response => {
    if (response.status === 204){
      console.log('archived success');
    }else{
      console.log('archived error');
    }
  })
  load_mailbox('archive');
}

async function unarchive_email(email_id){

  await fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false,
    })
  })
  .then(response => {
    if (response.status === 204){
      console.log('unarchived success');
    }else{
      console.log('unarchived error');
    }
  })
  load_mailbox('archive');
}
async function mark_mail_as_read(email_id) {
  
  await fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true,
    })
  })
  .then(response => {
    if (response.status === 204){
      console.log('mark read success');
    }else{
      console.log('mark read error');
    }
  })
}
async function mark_mail_as_unread(email_id) {
  
  await fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false,
    })
  })
  .then(response => {
    if (response.status === 204){
      console.log('mark unread success');
    }else{
      console.log('mark unread error');
    }
  })
  load_mailbox('inbox');
}
function add_spinner(){
  console.log('remove all content');
  document.querySelector('#email-detail').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  // document.querySelector('#mailbox-emails').innerHTML = ``;
  document.querySelector('#compose-view').style.display = 'none';
  console.log('add spinner');
  $('#spinner').addClass('spinner-border');
}

function remove_spinner(){
  console.log('remove_spinner');
  $('#spinner').removeClass('spinner-border');
}

