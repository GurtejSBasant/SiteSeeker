document.getElementById('searchButton').addEventListener('click', search);
document.getElementById('employeeFetchButton').addEventListener('click', fetchEmployees);
document.getElementById('managerFetchButton').addEventListener('click', fetchManagers);

let currentPage = 0;

async function search() {
    const searchTerm = document.getElementById('searchInput').value;
    const dataDisplay = document.getElementById('dataDisplay');
    const searchButton = document.getElementById('searchButton');
    dataDisplay.innerHTML = 'Searching...';
    searchButton.disabled = true;

    try {
        const response = await fetchWithTimeout(`https://stagingsourcebae.shethink.in/remote/search?term=${encodeURIComponent(searchTerm)}`, {
            mode: 'cors'
        });

        const searchData = await response.json();
        console.log("searchdata:",searchData)
        console.log('Initial search response:', searchData); // Debug log

        if (!Array.isArray(searchData.jobs) || searchData.jobs.length === 0) {
            dataDisplay.innerHTML = 'No results found on this website. Searching on other websites...';
            await searchCompanies(searchTerm, currentPage);
        } else {
            displayData(searchData);
            await searchCompanies(searchTerm, currentPage);
        }
    } catch (error) {
        console.error('Error during search:', error);
        dataDisplay.innerHTML = `Error: ${error.message}`;
        await searchCompanies(searchTerm, currentPage);
    } finally {
        searchButton.disabled = false;
    }
}

function fetchWithTimeout(url, options = {}, timeout = 0) {
    return new Promise((resolve, reject) => {
        const fetchPromise = fetch(url, options);

        if (timeout > 0) {
            const timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeout);
            fetchPromise
                .then(response => {
                    clearTimeout(timeoutId);
                    resolve(response);
                })
                .catch(err => {
                    clearTimeout(timeoutId);
                    reject(err);
                });
        } else {
            fetchPromise
                .then(response => resolve(response))
                .catch(err => reject(err));
        }
    });
}

function displayData(response) {
    const dataDisplay = document.getElementById('dataDisplay');
    dataDisplay.innerHTML = '';

    if (!response || !response.jobs || response.jobs.length === 0) {
        dataDisplay.innerHTML = 'No results found';
        return;
    }

    response.jobs.forEach(jobData => {
        const jobDiv = document.createElement('div');
        jobDiv.classList.add('job-item');

        const jobContent = `
            <h2>${jobData.title}</h2>
            <p>Company: ${jobData.company}</p>
            <p>Location: ${jobData.location}</p>
            <p>Tags: ${jobData.tags}</p>
            <a href="${jobData.link}" target="_blank">Link</a>
        `;

        jobDiv.innerHTML = jobContent;
        dataDisplay.appendChild(jobDiv);
    });
}

async function fetchEmployeeEmail(apiKey, fullName, companyDomain) {
    try {
        let organizationName;
        if (isValidURL(companyDomain)) {
            const url = new URL(companyDomain);
            organizationName = url.hostname.replace(/^www\./, '').split('.')[0];
        } else {
            throw new Error('Invalid company domain URL');
        }

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        const response = await fetch('https://stagingsourcebae.shethink.in/remote/fetch-employees-emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                first_name: firstName,
                last_name: lastName,
                organization_name: organizationName,
                domain: companyDomain,
                reveal_personal_emails: true
            })
        });

        const data = await response.json();
        console.log('Employee email response:', data); // Debug log

        if (data && data.person) {
            const person = data.person;
            const sanitizedPhone = person.sanitized_phone || 'N/A';
            const email = person.email || 'N/A';
            const name = person.name || `${firstName} ${lastName}`;

            return { email, contact: sanitizedPhone };
        } else {
            console.error('Invalid response structure:', data);
            throw new Error('Failed to fetch employee email');
        }
    } catch (error) {
        console.error('Error fetching employee email:', error);
        throw new Error('Failed to fetch employee email');
    }
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function fetchYcombinatorData(query, companiesId) {
    try {
        const response = await fetch(`https://stagingsourcebae.shethink.in/scraper/fetch-data?query=${query}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ companiesId: companiesId })
        });
        const data = await response.json();
        displayCompanyDetails(data);
    } catch (error) {
        console.error('Error fetching Ycombinator data:', error);
    }
}

function displayCompanyDetails(data) {
    const companyDetailsElement = document.getElementById('companyDetails');
    companyDetailsElement.innerHTML = '';

    if (!data || !data.companies || data.companies.length === 0) {
        companyDetailsElement.innerHTML = 'No company details found';
        return;
    }

    data.companies.forEach(company => {
        const companyDiv = document.createElement('div');
        companyDiv.classList.add('company-item');

        const companyContent = `
            <h3>${company.name}</h3>
            <p><strong>Website:</strong> <a href="${company.website}" target="_blank">${company.website}</a></p>
        `;

        companyDiv.innerHTML = companyContent;

        if (company.jobs && company.jobs.length > 0) {
            company.jobs.forEach(job => {
                const jobBox = document.createElement('div');
                jobBox.classList.add('job-box');

                const jobContent = `
                    <p><strong>Title:</strong> ${job.title}</p>
                    <p><strong>Skills:</strong> ${job.skillsTags}</p>
                    <p><strong>Minimum Experience:</strong> ${job.pretty_min_experience}</p>
                    <p><strong>Salary Range:</strong> ${job.pretty_salary_range}</p>
                    <p><strong>Equity Range:</strong> ${job.pretty_equity_range}</p>
                `;

                jobBox.innerHTML = jobContent;
                companyDiv.appendChild(jobBox);
            });
        } else {
            const noJobsMessage = document.createElement('p');
            noJobsMessage.textContent = 'No jobs available';
            companyDiv.appendChild(noJobsMessage);
        }

        companyDetailsElement.appendChild(companyDiv);
    });
}

async function searchCompanies(query, currentPage) {
    if (query === '') {
        alert('Please enter a search query.');
        return;
    }

    try {
        const response = await fetch(`https://stagingsourcebae.shethink.in/scraper?query=${query}&page=${currentPage}&hitsPerPage=10`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('Search companies response:', result); // Debug log

        const companyIds = result.allCompanyIds;
        if (companyIds && companyIds.length > 0) {
            await fetchYcombinatorData(query, companyIds);
        } else {
            console.log('No company IDs found in response'); // Debug log
        }
    } catch (error) {
        console.error('Error fetching companies:', error);
    }
}

async function fetchEmployees() {
    const domain = document.getElementById('domainInput').value;
    if (domain === '') {
        alert('Please enter a company domain.');
        return;
    }

    try {
        const response = await fetch('https://stagingsourcebae.shethink.in/remote/fetch-employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: "ppKeBXq42XUYmR7o6NyW6Q",
                q_organization_domains: domain
            })
        });

        const employeeData = await response.json();
        console.log('Employee data response:', employeeData); // Debug log
        displayEmployees(employeeData);
    } catch (error) {
        console.error('Error fetching employees:', error);
    }
}

async function fetchManagers() {
    const domain = document.getElementById('domainInput').value;
    if (domain === '') {
        alert('Please enter a company domain.');
        return;
    }

    console.log('Fetching managers for domain:', domain); // Debug log

    try {
        const response = await fetch('https://stagingsourcebae.shethink.in/remote/fetch-employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: "ppKeBXq42XUYmR7o6NyW6Q",
                q_organization_domains: domain,
                person_seniorities: ["manager"] // Include person_seniorities as requested
            })
        });

        const managerData = await response.json();
        console.log('Manager data response:', managerData); // Debug log
        displayManagers(managerData); // New function for displaying manager data
    } catch (error) {
        console.error('Error fetching managers:', error);
    }
}

function displayEmployees(data) {
    const dataDisplay = document.getElementById('dataDisplay');
    dataDisplay.innerHTML = '';

    const employees = data.people || [];
    const contacts = data.contacts || [];

    const allEmployees = [...employees, ...contacts];

    if (allEmployees.length === 0) {
        dataDisplay.innerHTML = 'No employees found';
        return;
    }

    allEmployees.forEach(employee => {
        const employeeDiv = document.createElement('div');
        employeeDiv.classList.add('data-item');

        const email = employee.email || 'Email not disclosed';
        const contact = employee.contact || 'N/A';

        const employeeContent = `
            <div>
                <h2>${employee.name}</h2>
                <p>Position: ${employee.title || 'N/A'}</p>
                <p>Email: ${email}</p>
                <p>${contact}</p>
                <a href="${employee.linkedin_url}" target="_blank">LinkedIn Profile</a>
                <button class="reveal-email" data-employee="${employee.name}" data-domain="${employee.domain}">Reveal Email</button>
            </div>
        `;

        employeeDiv.innerHTML = employeeContent;
        dataDisplay.appendChild(employeeDiv);
    });

    // Attach click event listener to reveal email buttons
    const revealButtons = document.querySelectorAll('.reveal-email');
    revealButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const fullName = button.dataset.employee;
            const domain = document.getElementById('domainInput').value;
            const apiKey = 'ppKeBXq42XUYmR7o6NyW6Q';
            try {
                const { email, contact } = await fetchEmployeeEmail(apiKey, fullName, domain);
                const emailElement = button.parentElement.querySelector('p:nth-of-type(2)');
                emailElement.textContent = `Email: ${email}`;
                const contactElement = button.parentElement.querySelector('p:nth-of-type(3)');
                contactElement.textContent = contact;
            } catch (error) {
                console.error('Error:', error.message);
                alert('Failed to fetch employee email');
            }
        });
    });
}

// New function for displaying manager data
function displayManagers(data) {
    const dataDisplay = document.getElementById('dataDisplay');
    dataDisplay.innerHTML = '';

    const managers = data.people || [];
    const contacts = data.contacts || [];

    const allManagers = [...managers, ...contacts];

    if (allManagers.length === 0) {
        dataDisplay.innerHTML = 'No managers found';
        return;
    }

    allManagers.forEach(manager => {
        const managerDiv = document.createElement('div');
        managerDiv.classList.add('data-item');

        const email = manager.email || 'Email not disclosed';
        const contact = manager.contact || 'N/A';

        const managerContent = `
            <div>
                <h2>${manager.name}</h2>
                <p>Position: ${manager.title || 'N/A'}</p>
                <p>Email: ${email}</p>
                <p>${contact}</p>
                <a href="${manager.linkedin_url}" target="_blank">LinkedIn Profile</a>
                <button class="reveal-email" data-employee="${manager.name}" data-domain="${manager.domain}">Reveal Email</button>
            </div>
        `;

        managerDiv.innerHTML = managerContent;
        dataDisplay.appendChild(managerDiv);
    });

    // Attach click event listener to reveal email buttons
    const revealButtons = document.querySelectorAll('.reveal-email');
    revealButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const fullName = button.dataset.employee;
            const domain = document.getElementById('domainInput').value;
            const apiKey = 'ppKeBXq42XUYmR7o6NyW6Q';
            try {
                const { email, contact } = await fetchEmployeeEmail(apiKey, fullName, domain);
                const emailElement = button.parentElement.querySelector('p:nth-of-type(2)');
                emailElement.textContent = `Email: ${email}`;
                const contactElement = button.parentElement.querySelector('p:nth-of-type(3)');
                contactElement.textContent = contact;
            } catch (error) {
                console.error('Error:', error.message);
                alert('Failed to fetch employee email');
            }
        });
    });
}

function nextPage() {
    currentPage++;
    search();
}

function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        search();
    }
}
