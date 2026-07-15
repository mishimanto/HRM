import Swal from 'sweetalert2';

const buttonClasses = {
  confirm: 'bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-sm font-bold',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-sm font-bold',
  cancel: 'bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 text-sm font-bold me-3',
};

export const confirmDialog = async ({
  title,
  text,
  confirmButtonText = 'Confirm',
  icon = 'warning',
  danger = false,
}) => {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-[8px]',
      confirmButton: danger ? buttonClasses.danger : buttonClasses.confirm,
      cancelButton: buttonClasses.cancel,
    },
  });

  return result.isConfirmed;
};

export const promptDialog = async ({
  title,
  inputLabel,
  inputPlaceholder = '',
  confirmButtonText = 'Submit',
}) => {
  const result = await Swal.fire({
    title,
    input: 'textarea',
    inputLabel,
    inputPlaceholder,
    inputAttributes: {
      'aria-label': inputLabel,
    },
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    buttonsStyling: false,
    customClass: {
      popup: 'rounded-[8px]',
      input: 'border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:border-teal-400 focus:ring-teal-100',
      confirmButton: buttonClasses.confirm,
      cancelButton: buttonClasses.cancel,
    },
    inputValidator: value => (!value?.trim() ? 'Please enter a response' : undefined),
  });

  return result.isConfirmed ? result.value.trim() : null;
};
