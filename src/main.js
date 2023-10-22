const core = require('@actions/core')
const fs = require('fs')
const fetch = require('node-fetch')

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  try {
    // Get the values from repository secrets
    const osgioId = core.getInput('osgeo-id')
    const osgioPassword = core.getInput('osgeo-password')

    // Path to the release .zip file configured in the Action's input
    const releaseZipPath = core.getInput('release-zip-path')

    // Read the release .zip file
    const releaseZip = fs.createReadStream(releaseZipPath)

    // Authenticate with the QGIS Plugin Repository
    const auth = `Basic ${Buffer.from(`${osgioId}:${osgioPassword}`).toString(
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
