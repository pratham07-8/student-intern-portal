import prisma from "../Models/db.js";
import { generateTrainingLetterPDF } from "../services/pdfService.js";
import { sendTrainingLetterEmail } from "../services/emailService.js";

// Submit a new request
export const submit = async (req, res) => {
  try {
    const {
      salutation,
      traineeName,
      relationship,
      instituteName,
      fromDate,
      toDate,
      areaOfTraining,
      guideName,
      guideSalutation,
      guideDesignation,
      guideDepartment
    } = req.body;

    if (!salutation || !traineeName || !relationship || !instituteName || !fromDate || !toDate || !areaOfTraining || !guideName || !guideSalutation || !guideDesignation || !guideDepartment) {
      return res.status(400).json({ success: false, message: "All form fields are required before submitting." });
    }

    const proposer_id = req.user && req.user.id ? parseInt(req.user.id, 10) : null;

    if (proposer_id) {
      const userExists = await prisma.user.findUnique({ where: { id: proposer_id } });
      if (!userExists) {
        return res.status(400).json({ success: false, message: "Logged in user session is invalid or user no longer exists. Please re-login." });
      }
    }

    const traineeDetail = await prisma.trainee.create({
      data: {
        salutation: String(salutation).slice(0, 10),
        full_name: String(traineeName).slice(0, 100),
        relationship: String(relationship).slice(0, 20),
        institute: String(instituteName).slice(0, 500),
        from_date: new Date(fromDate),
        to_date: new Date(toDate),
        area_of_training: String(areaOfTraining).slice(0, 150)
      }
    });

    const guideDetail = await prisma.guide.create({
      data: {
        salutation: String(guideSalutation).slice(0, 10),
        full_name: String(guideName).slice(0, 100),
        designation: String(guideDesignation).slice(0, 100),
        department: String(guideDepartment).slice(0, 100)
      }
    });

    const requestDetail = await prisma.training_request.create({
      data: {
        trainee_id: traineeDetail.id,
        guide_id: guideDetail.id,
        proposer_id: proposer_id,
        status: "PENDING_GUIDE",
        remarks: ""
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Training request submitted successfully',
      requestId: requestDetail.id
    });
  } catch (err) {
    console.error("Database Submit Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to submit request due to a server or database error." });
  }
};

// Get requests based on user role
export const getRequests = async (req, res) => {
  try {
    const { role, id: userId, name: userName, department: userDept } = req.user;

    let requests = [];

    if (role === "PROPOSER") {
      requests = await prisma.training_request.findMany({
        where: { proposer_id: userId },
        include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
        orderBy: { submitted_at: 'desc' }
      });
    } else if (role === "GUIDE_GM") {
      if (userDept && userDept.trim()) {
        requests = await prisma.training_request.findMany({
          where: {
            status: "PENDING_GGM",
            guide: {
              department: {
                equals: userDept.trim(),
                mode: 'insensitive'
              }
            }
          },
          include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
          orderBy: { submitted_at: 'desc' }
        });
        // Fallback: If no exact department match, return all PENDING_GGM requests
        if (requests.length === 0) {
          requests = await prisma.training_request.findMany({
            where: { status: "PENDING_GGM" },
            include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
            orderBy: { submitted_at: 'desc' }
          });
        }
      } else {
        requests = await prisma.training_request.findMany({
          where: { status: "PENDING_GGM" },
          include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
          orderBy: { submitted_at: 'desc' }
        });
      }
    } else if (role === "GUIDE") {
      // First try matching requests assigned to this specific Guide name
      requests = await prisma.training_request.findMany({
        where: {
          status: "PENDING_GUIDE",
          guide: {
            full_name: {
              contains: userName,
              mode: 'insensitive'
            }
          }
        },
        include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
        orderBy: { submitted_at: 'desc' }
      });
      // Fallback: If no exact guide name match, return all PENDING_GUIDE requests for reviewer convenience
      if (requests.length === 0) {
        requests = await prisma.training_request.findMany({
          where: { status: "PENDING_GUIDE" },
          include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
          orderBy: { submitted_at: 'desc' }
        });
      }
    } else {
      let targetStatus = "";
      if (role === "TRAINING_OFFICER") targetStatus = "PENDING_TO";
      else if (role === "HR_GM") targetStatus = "PENDING_HR";

      requests = await prisma.training_request.findMany({
        where: { status: targetStatus },
        include: { trainee: true, guide: true, proposer: { select: { name: true, email: true } } },
        orderBy: { submitted_at: 'desc' }
      });
    }

    return res.status(200).json({
      success: true,
      requests
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Take action on a request (Approve / Reject)
export const takeAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, remarks } = req.body;
    const { role } = req.user;

    const trainingRequest = await prisma.training_request.findUnique({
      where: { id: parseInt(id) },
      include: { guide: true }
    });

    if (!trainingRequest) {
      return res.status(404).json({ success: false, message: "Training request not found" });
    }

    if (role === "GUIDE_GM" && req.user.department && trainingRequest.guide?.department) {
      if (trainingRequest.guide.department.trim().toLowerCase() !== req.user.department.trim().toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: `Unauthorized: Your account department (${req.user.department}) does not match the Guide's department (${trainingRequest.guide.department})`
        });
      }
    }

    // Determine next status
    let nextStatus = trainingRequest.status;

    if (action === "REJECT") {
      if (role === "GUIDE" && trainingRequest.status === "PENDING_GUIDE") {
        nextStatus = "REJECTED"; // Back to Proposer
      } else if (role === "GUIDE_GM" && trainingRequest.status === "PENDING_GGM") {
        nextStatus = "PENDING_GUIDE"; // Back to Guide
      } else if (role === "TRAINING_OFFICER" && trainingRequest.status === "PENDING_TO") {
        nextStatus = "PENDING_GGM"; // Back to Dept GM
      } else if (role === "HR_GM" && trainingRequest.status === "PENDING_HR") {
        nextStatus = "PENDING_TO"; // Back to Training Officer
      } else {
        return res.status(400).json({
          success: false,
          message: `This request is currently '${trainingRequest.status}' and cannot be rejected by ${role}. It has already been moved to another step.`
        });
      }
    } else if (action === "APPROVE") {
      if (role === "GUIDE" && trainingRequest.status === "PENDING_GUIDE") {
        nextStatus = "PENDING_GGM";
      } else if (role === "GUIDE_GM" && trainingRequest.status === "PENDING_GGM") {
        nextStatus = "PENDING_TO";
      } else if (role === "TRAINING_OFFICER" && trainingRequest.status === "PENDING_TO") {
        nextStatus = "PENDING_HR";
      } else if (role === "HR_GM" && trainingRequest.status === "PENDING_HR") {
        nextStatus = "APPROVED";
      } else {
        return res.status(400).json({
          success: false,
          message: `This request is currently '${trainingRequest.status}' and has already been approved/forwarded to the next step!`
        });
      }
    } else {
      return res.status(400).json({ success: false, message: "Invalid action type" });
    }

    const updatedRequest = await prisma.training_request.update({
      where: { id: parseInt(id) },
      data: {
        status: nextStatus,
        remarks: remarks !== undefined ? remarks : (trainingRequest.remarks || "")
      },
      include: {
        trainee: true,
        guide: true,
        proposer: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (nextStatus === "APPROVED") {
      try {
        const { signature } = req.body;
        const hrSignature = signature || req.user.signature_url || updatedRequest.hr_signature;

        // If HR provided a new signature, store it on the request record
        if (signature) {
          await prisma.training_request.update({
            where: { id: parseInt(id) },
            data: { hr_signature: signature }
          });
        }

        // Look up registered Guide user to find their email
        const guideUser = await prisma.user.findFirst({
          where: {
            role: "GUIDE",
            name: {
              equals: updatedRequest.guide.full_name,
              mode: 'insensitive'
            }
          }
        });

        const recipientEmails = [];
        if (updatedRequest.proposer && updatedRequest.proposer.email) {
          recipientEmails.push(updatedRequest.proposer.email);
        }
        if (guideUser && guideUser.email) {
          recipientEmails.push(guideUser.email);
        }

        if (recipientEmails.length > 0) {
          // Generate PDF with dynamic HR user details and signature
          const pdfBuffer = await generateTrainingLetterPDF(
            updatedRequest.trainee,
            updatedRequest.guide,
            updatedRequest.proposer,
            req.user,
            hrSignature
          );
          // Send Email with attachment and formatted letterhead HTML body
          await sendTrainingLetterEmail(
            recipientEmails, 
            updatedRequest.trainee, 
            updatedRequest.guide, 
            pdfBuffer, 
            updatedRequest.proposer, 
            req.user, 
            hrSignature
          );
        } else {
          console.warn(`No recipient emails found to send the training letter for request ID ${updatedRequest.id}`);
        }
      } catch (emailErr) {
        // Log the error but do not fail the request approval response
        console.error("Failed to generate/send training letter PDF:", emailErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Request successfully ${action.toLowerCase()}d`,
      request: updatedRequest
    });
  } catch (err) {
    console.error("Take Action Exception:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to process request action due to a server error.", error: err.message });
  }
};

// Delete a training request (application)
export const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requestId = parseInt(id, 10);

    if (isNaN(requestId)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const trainingRequest = await prisma.training_request.findUnique({
      where: { id: requestId }
    });

    if (!trainingRequest) {
      return res.status(404).json({ success: false, message: "Training request not found" });
    }

    // Permission check: Proposers can delete their own requests, Reviewers can delete visible requests
    if (req.user.role === "PROPOSER" && trainingRequest.proposer_id !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this application" });
    }

    // Delete training_request, trainee, and guide records cleanly
    await prisma.$transaction([
      prisma.training_request.delete({ where: { id: requestId } }),
      prisma.trainee.delete({ where: { id: trainingRequest.trainee_id } }),
      prisma.guide.delete({ where: { id: trainingRequest.guide_id } })
    ]);

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully"
    });
  } catch (err) {
    console.error("Delete Request Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to delete request" });
  }
};

