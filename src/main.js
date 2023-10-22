const core = require('@actions/core')
const fs = require('fs')
const fetch = require('node-fetch')

// Function to find the first .zip file in the directory
function findZipFile(directory) {
  const files = fs.readdirSync(directory)
  for (const file of files) {
    if (file.endsWith('.zip')) {
      return path.join(directory, file)
    }
  }
  return null // Return null if no .zip file is found
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // Get the values from repository secrets
    const osgeoId = core.getInput('osgeo-id')
    const osgeoPassword = core.getInput('osgeo-password')

    // Path to the release .zip file configured in the Action's input
    const releaseZipDirectory = core.getInput('release-zip-path')

    // Read the release .zip file
    const firstZipFile = findZipFile(releaseZipDirectory)
    if (!firstZipFile) {
      core.error('No .zip file found in the specified directory.')
      core.setFailed('Release upload failed. No release .zip found')
    }
    const releaseZip = fs.createReadStream(firstZipFile)

    // Authenticate with the QGIS Plugin Repository
    const auth = `Basic ${Buffer.from(`${osgeoId}:${osgeoPassword}`).toString(
      'base64'
    )}`

    // Upload the release .zip file
    const uploadResponse = await fetch(
      'https://plugins.qgis.org/plugins/add/',
      {
        method: 'POST',
        body: releaseZip,
        headers: {
          Authorization: auth,
          'Content-Type': 'application/zip'
        }
      }
    )

    if (uploadResponse.status === 200) {
      core.debug('Release .zip file uploaded successfully.')
      core.setOutput('success', 'https://plugins.qgis.org/plugins/')
    } else {
      core.error('Failed to upload the release .zip file.')
      core.error(await uploadResponse.text())
      core.setFailed('Release upload failed')
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

module.exports = {
  run
}
